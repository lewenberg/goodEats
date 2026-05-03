import Footer from "@/components/Footer";
import Header from "@/components/Header";

type Props = {
  children: React.ReactNode;
  showHero?: boolean;
};

const Layout = ({ children }: Props) => (
  <div className="min-h-screen overflow-x-hidden bg-background text-slate-950">
    <Header />
    <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5 lg:px-8">{children}</main>
    <Footer />
  </div>
);

export default Layout;
