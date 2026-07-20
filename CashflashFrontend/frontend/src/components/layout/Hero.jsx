import { useNavigate } from "react-router-dom";
import { HeroCards } from "./HeroCards";
import { ModeToggle } from "../shared/ModeToggle";
import { ThemeLogo } from "../shared/ThemeLogo";
import { Button } from "@/components/ui/button"
import Lightning from "../shared/Lightning";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <>
      <Lightning hue={240} />
      <div className="hidden min-[1351px]:block">
        <ThemeLogo />
      </div>
      <section className="mx-auto grid min-h-screen max-w-6xl place-items-center gap-10 px-4 pt-20 md:pt-24 lg:grid-cols-2 lg:pt-32">
        <div className="fixed top-4 right-4 z-50">
          <ModeToggle className="w-8 h-8" />
        </div>
        <div className="mt-18 max-w-2xl space-y-6 text-center md:mt-24 lg:mt-32 lg:text-start">
          <main className="text-4xl font-bold sm:text-5xl md:text-6xl">
            <h2 className="inline">
              Just another <br />
              <span className="inline bg-linear-to-r from-[#e78e4a] via-[#ef6f1a] to-[#e78e4a] text-transparent bg-clip-text">
                Payment Application
              </span>
            </h2>{" "}
            but{" "}
            <h2 className="inline">
              only{" "}
              <span className="inline-flex items-center gap-1">
                <span className="bg-linear-to-r from-[#1fc0f1] via-[#087998] to-[#1fc0f1] text-transparent bg-clip-text">
                  fasterrr
                </span>
              </span>
            </h2>
          </main>

          <p className="mx-auto hidden text-lg text-muted-foreground md:block md:w-10/12 lg:mx-0 xl:text-xl">
            Pay any <span className="font-bold">cashflash</span> user or merchant seamlessly using your preferred
            payment methods
          </p>

          <div className="ml-6 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              className="w-full sm:w-44"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              className="w-full border border-gray-500 sm:w-44"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </div>
        </div>
        <div className="z-10">
          <HeroCards />
        </div>
        <div className="shadow"></div>
      </section>
    </>
  );
};
