import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";
import { createSession, destroySession, currentUser } from "./lib/auth";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

async function register(req) {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.email(),
      password: z.string().min(10).max(128),
    });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Check your name, email and password (minimum 10 characters)." }, 400);
    const email = parsed.data.email.toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) {
      return json({ error: "An account with this email already exists." }, 409);
    }
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
      },
    });
    await createSession(user.id);
    return json({ ok: true }, 201);
  } catch {
    return json({ error: "Registration failed." }, 500);
  }
}

async function login(req) {
  try {
    const parsed = z.object({
      email: z.email(),
      password: z.string().min(1).max(128),
    }).safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid email or password." }, 400);
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return json({ error: "Invalid email or password." }, 401);
    }
    await createSession(user.id);
    return json({ ok: true });
  } catch {
    return json({ error: "Login failed." }, 500);
  }
}

async function logout() {
  await destroySession();
  return NextResponse.redirect(new URL("/", process.env.APP_URL || "http://localhost:3000"));
}

async function cart(method, req) {
  const user = await currentUser();
  if (!user) return json({ error: "Sign in required" }, 401);

  if (method === "GET") {
    return json(await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    }));
  }

  if (method === "DELETE") {
    const { productId } = await req.json();
    await prisma.cartItem.deleteMany({ where: { userId: user.id, productId } });
    return json({ ok: true });
  }

  try {
    const { productId, quantity = 1 } = await req.json();
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return json({ error: "Invalid cart item." }, 400);
    }
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active || product.stock < quantity) {
      return json({ error: "Product unavailable or insufficient stock." }, 400);
    }
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) return json({ error: "Not enough stock." }, 400);
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId, quantity },
      update: { quantity: nextQuantity },
    });
    return json({ ok: true });
  } catch {
    return json({ error: "Could not update cart." }, 400);
  }
}

async function orders(method, req) {
  const user = await currentUser();
  if (!user) return json({ error: "Please sign in." }, 401);

  if (method === "GET") {
    return json(await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }));
  }

  try {
    const parsed = z.object({
      customerName: z.string().min(2).max(100),
      phone: z.string().min(7).max(30),
      address: z.string().min(5).max(300),
      city: z.string().min(2).max(80),
      currency: z.enum(["PKR", "USD"]),
      paymentMethod: z.enum(["COD", "ONLINE"]),
    }).safeParse(await req.json());
    if (!parsed.success) return json({ error: "Please complete all delivery details." }, 400);

    const cart = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });
    if (!cart.length) return json({ error: "Your cart is empty." }, 400);
    for (const item of cart) {
      if (!item.product.active || item.product.stock < item.quantity) {
        return json({ error: `Insufficient stock for ${item.product.name}.` }, 409);
      }
    }

    const total = cart.reduce((sum, item) =>
      sum + (parsed.data.currency === "PKR" ? item.product.pricePKR : item.product.priceUSD) * item.quantity, 0);
    if (parsed.data.paymentMethod === "ONLINE" && parsed.data.currency === "PKR") {
      return json({ error: "PKR online payments are not configured. Choose COD." }, 400);
    }
    if (parsed.data.paymentMethod === "ONLINE" && !process.env.STRIPE_SECRET_KEY) {
      return json({ error: "Online payments are not configured yet. Choose Cash on Delivery." }, 503);
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: user.id,
          ...parsed.data,
          total,
          paymentStatus: parsed.data.paymentMethod === "COD" ? "UNPAID" : "PENDING",
          items: {
            create: cart.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              price: parsed.data.currency === "PKR" ? item.product.pricePKR : item.product.priceUSD,
              quantity: item.quantity,
            })),
          },
        },
      });
      for (const item of cart) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await tx.cartItem.deleteMany({ where: { userId: user.id } });
      return created;
    });

    if (parsed.data.paymentMethod === "ONLINE") {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        currency: "usd",
        line_items: cart.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd",
            unit_amount: item.product.priceUSD,
            product_data: { name: item.product.name },
          },
        })),
        success_url: `${process.env.APP_URL}/orders?payment=success`,
        cancel_url: `${process.env.APP_URL}/orders?payment=cancelled`,
        metadata: { orderId: order.id, userId: user.id },
      });
      return json({ checkoutUrl: session.url });
    }
    return json({ ok: true, orderId: order.id }, 201);
  } catch {
    return json({ error: "Unable to place order. Please try again." }, 500);
  }
}

async function adminProducts(req) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return json({ error: "Forbidden" }, 403);
  const schema = z.object({
    name: z.string().min(2).max(120),
    description: z.string().min(5).max(2000),
    image: z.url(),
    pricePKR: z.coerce.number().int().positive(),
    priceUSD: z.coerce.number().int().positive(),
    stock: z.coerce.number().int().min(0),
    categoryId: z.string(),
    featured: z.boolean().optional(),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return json({ error: "Invalid product details." }, 400);
  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
  const product = await prisma.product.create({ data: { ...parsed.data, slug } });
  return json(product, 201);
}

async function adminOrders(req) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return json({ error: "Forbidden" }, 403);
  const parsed = z.object({
    id: z.string(),
    status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  }).safeParse(await req.json());
  if (!parsed.success) return json({ error: "Invalid update" }, 400);
  const order = await prisma.order.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  return json(order);
}

export async function dispatch(method, req) {
  const path = req.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (path === "/api/auth/register" && method === "POST") return register(req);
  if (path === "/api/auth/login" && method === "POST") return login(req);
  if (path === "/api/auth/logout" && method === "POST") return logout();
  if (path === "/api/cart" && ["GET", "POST", "DELETE"].includes(method)) return cart(method, req);
  if (path === "/api/orders" && ["GET", "POST"].includes(method)) return orders(method, req);
  if (path === "/api/admin/products" && method === "POST") return adminProducts(req);
  if (path === "/api/admin/orders" && method === "PATCH") return adminOrders(req);

  return json({ error: "Route not found." }, 404);
}
