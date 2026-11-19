"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useStore } from "./store-provider";
import { formatMoney } from "@/lib/money";
export default function ProductCard({product,index=0}) {
 const {currency}=useStore(); const price=currency==="PKR"?product.pricePKR:product.priceUSD;
 return <motion.article className="product-card" initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:index%4*.07,duration:.45}}>
  <Link href={`/products/${product.slug}`}><div className="product-image"><img src={product.image} alt={product.name}/>{product.featured&&<span className="tag">FEATURED</span>}</div><div className="product-info"><small>{product.category?.name}</small><h3>{product.name}</h3><b>{formatMoney(price,currency)}</b></div></Link>
 </motion.article>
}
