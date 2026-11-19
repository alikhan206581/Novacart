require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

async function main(){
 const names=["Electronics","Fashion","Shoes","Home & Living","Beauty","Sports & Fitness","Groceries","Accessories"];
 const cats={};for(const n of names){const slug=n.toLowerCase().replace(/ & /g,"-").replace(/\s+/g,"-");cats[n]=await p.category.upsert({where:{slug},update:{},create:{name:n,slug}});}
 const adminEmail=process.env.ADMIN_EMAIL||"admin@novacart.local";const adminPassword=process.env.ADMIN_PASSWORD;
 if(adminPassword&&adminPassword.length>=12){await p.user.upsert({where:{email:adminEmail},update:{},create:{name:"NovaCart Admin",email:adminEmail,passwordHash:await bcrypt.hash(adminPassword,12),role:"ADMIN"}});}
 const demo=[
 ["Wireless Headphones","Immersive everyday audio with a comfortable over-ear fit.",12999,4999,"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900",32,"Electronics"],
 ["Minimal Sneakers","A clean everyday sneaker built for all-day comfort.",8999,3499,"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900",24,"Shoes"],
 ["Everyday Backpack","A versatile carry-all for work, travel and weekends.",7499,2999,"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900",18,"Accessories"],
 ["Smart Watch","Keep your day on track with a sleek smart watch.",18999,7999,"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900",15,"Electronics"],
 ["Modern Table Lamp","Warm, considered lighting for your favourite corner.",5999,2499,"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900",12,"Home & Living"],
 ["Skincare Essentials","A simple daily-care set for your routine.",4499,1999,"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900",30,"Beauty"],
 ["Classic Sunglasses","An easy statement frame for sunny days.",4999,1999,"https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900",20,"Fashion"],
 ["Yoga Mat","Supportive grip and cushioning for your daily practice.",3999,1599,"https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=900",25,"Sports & Fitness"]
 ];
 for(let i=0;i<demo.length;i++){const [name,description,pricePKR,priceUSD,image,stock,cat]=demo[i];const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-");await p.product.upsert({where:{slug},update:{},create:{name,description,pricePKR,priceUSD,image,stock,featured:true,slug,categoryId:cats[cat].id}});}
}
main().then(()=>console.log("Seed complete")).catch(e=>{console.error(e);process.exit(1)}).finally(()=>p.$disconnect());
