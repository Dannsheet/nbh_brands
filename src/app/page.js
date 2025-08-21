// app/page.js
import Hero from "../components/Hero";
import CarruselDestacados from "../components/CarruselDestacados";
import RecienLlegados from "../components/RecienLlegados";

export default function Home() {
  return (
    <main className="bg-primary text-accent">
      <Hero />
      <section className="snap-start">
        <CarruselDestacados />
        <RecienLlegados />
      </section>
    </main>
  );
}
