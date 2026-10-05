import { useEffect, useState } from "react";
import { getSupabase } from "../api/supabase";
import Reveal from "../component/Reveal";

type GalleryImage = {
  id: number;
  url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
};

const Gallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const supabase = getSupabase();

        const { data, error } = await supabase
          .from("gallery_images")
          .select("id, url, alt, sort_order, created_at")
          .order("sort_order", { ascending: true });

        if (error) {
          throw error;
        }

        setImages(data ?? []);
      } catch (err) {
        console.error("Failed to load gallery:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load gallery."
        );
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, []);

  if (loading) {
    return (
      <section className="bg-pearl px-5 py-24 text-center">
        <p className="text-taupe">Loading gallery...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-pearl px-5 py-24 text-center">
        <p className="text-rose-deep">
          Failed to load gallery: {error}
        </p>
      </section>
    );
  }

  return (
    <section
      id="gallery"
      className="bg-pearl px-5 py-24 sm:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1180px]">

        <Reveal>
          <p className="eyebrow">
            Our Gallery
          </p>

          <h2 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[0.95] text-ink">
            Our latest
            <br />
            work
          </h2>
        </Reveal>

        {images.length === 0 ? (
          <p className="mt-16 text-center text-taupe">
            No gallery images available.
          </p>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">

            {images.map((image, index) => (
              <Reveal
                key={image.id}
                delay={(index % 3) * 80}
              >
                <div className="group overflow-hidden">

                  <div className="aspect-[4/5] overflow-hidden bg-cream">

                    <img
                      src={image.url}
                      alt={image.alt || "Salon gallery image"}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />

                  </div>

                  {image.alt && (
                    <p className="mt-3 text-sm text-taupe">
                      {image.alt}
                    </p>
                  )}

                </div>
              </Reveal>
            ))}

          </div>
        )}

      </div>
    </section>
  );
};

export default Gallery;