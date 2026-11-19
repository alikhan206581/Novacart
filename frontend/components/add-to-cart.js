"use client";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
export default function AddToCart({productId,stock=0}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function add(){setBusy(true);setMessage("");try{const r=await fetch("/api/cart",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,quantity:1})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Please sign in first");setMessage("Added to cart ✓");}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 return <div><button className="btn btn-primary" disabled={!stock||busy} onClick={add}><ShoppingBag size={17}/>{busy?"Adding...":stock?"Add to cart":"Out of stock"}</button>{message&&<small className="form-note">{message}</small>}</div>
}
