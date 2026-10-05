import Nav from "../component/Nav";
import Hero from "../component/Hero";
import Services from "./Services";
import AboutUs from "./AboutUs";
import Gallery from "../component/Gallery";
import Booking from "../component/Booking";
import Footer from "../component/Footer";

const Home = () => {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <AboutUs />
        <Services />
        <Gallery />
        <Booking />
      </main>
      <Footer />
    </>
  );
};

export default Home;
