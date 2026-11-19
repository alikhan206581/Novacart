import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
export const metadata = { title: "NovaCart — Shop Everything", description: "Discover more. Shop smarter." };
export default function RootLayout({ children }) { return <html lang="en"><body><StoreProvider>{children}</StoreProvider></body></html>; }
