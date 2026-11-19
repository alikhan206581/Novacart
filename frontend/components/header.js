"use client";
import Link from "next/link";
import { ShoppingBag, Search, UserRound, Menu, Sparkles } from "lucide-react";
import { useStore } from "./store-provider";
export default function Header({user}) {
 const {currency,changeCurrency}=useStore();
 return <header className="header"><Link href="/" className="logo"><span className="logo-mark"><Sparkles size={19}/></span>nova<span>cart</span></Link>
 <nav><Link href="/products">Shop</Link><Link href="/products?category=electronics">Electronics</Link><Link href="/products?category=fashion">Fashion</Link><Link href="/products?category=home-living">Home & Living</Link></nav>
 <div className="header-actions"><select aria-label="Currency" value={currency} onChange={e=>changeCurrency(e.target.value)}><option value="PKR">PKR ₨</option><option value="USD">USD $</option></select><Link className="icon-link" href="/products" aria-label="Search"><Search/></Link><Link className="icon-link" href={user?"/account":"/login"} aria-label="Account"><UserRound/></Link><Link className="cart-link" href="/cart"><ShoppingBag size={18}/> Cart</Link></div></header>
}
