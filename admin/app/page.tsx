import { redirect } from "next/navigation";

// Admin web app - redirects to login page
export default function HomePage() {
  redirect("/login");
}
