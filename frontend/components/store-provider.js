"use client";
import { createContext, useContext, useEffect, useState } from "react";
const StoreContext = createContext(null);
export function StoreProvider({children}) {
  const [currency,setCurrency] = useState("PKR");
  const [cartCount,setCartCount] = useState(0);
  useEffect(()=>{ const saved=localStorage.getItem("novacart-currency"); if(saved) setCurrency(saved); },[]);
  function changeCurrency(value){setCurrency(value);localStorage.setItem("novacart-currency",value);}
  return <StoreContext.Provider value={{currency,changeCurrency,cartCount,setCartCount}}>{children}</StoreContext.Provider>;
}
export const useStore=()=>useContext(StoreContext);
