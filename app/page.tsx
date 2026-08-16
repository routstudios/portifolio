import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navigation } from "@/components/navigation";
import { Process } from "@/components/process";
import { Services } from "@/components/services";
import { Work } from "@/components/work";

export default function Home() {
  return <><Navigation /><main><Hero /><Work /><Services /><Process /><About /><Contact /></main><Footer /></>;
}
