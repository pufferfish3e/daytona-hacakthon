import { useNavigate } from "react-router-dom";
import { RepoUrlInput } from "../components/RepoUrlInput";
import { PRODUCT_NAME, VIDEO_SRC } from "../constants";
import { parseGitHubUrl } from "../data/mock";
import { useProjects } from "../context/ProjectsContext";

function StatsCard() {
  return (
    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64 sm:p-6">
      <p className="name-stat-number text-3xl tracking-tight text-[#010101] lg:text-white">
        2,400+
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[#010101]/70 lg:text-white/70">
        Teams use {PRODUCT_NAME} to turn archived code into experiences anyone can click through.
      </p>
    </div>
  );
}

function TestimonialCard() {
  return (
    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center bg-[#010101] text-xs font-semibold text-white lg:bg-white lg:text-[#010101]">
          A
        </div>
        <span className="text-sm font-medium text-[#010101] lg:text-white">Archive Labs</span>
      </div>
      <blockquote className="text-sm leading-relaxed text-[#010101]/80 lg:text-white/80">
        &ldquo;We had screenshots and a broken deploy. {PRODUCT_NAME} rebuilt it in isolation and
        gave us a link our whole team could actually use.&rdquo;
      </blockquote>
      <div className="mt-4 flex items-center gap-3">
        <img
          src="https://i.pravatar.cc/72?img=12"
          alt="Sara Klein"
          className="h-9 w-9 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-medium text-[#010101] lg:text-white">Sara Klein</p>
          <p className="text-xs text-[#010101]/60 lg:text-white/60">Head of Engineering</p>
        </div>
      </div>
    </div>
  );
}

interface HeroSectionProps {
  error?: string;
  onSubmit?: (url: string) => void;
}

function HeroRepoInput({ error, onSubmit }: HeroSectionProps) {
  const navigate = useNavigate();
  const { createFromUrl } = useProjects();

  async function handleSubmit(url: string) {
    if (onSubmit) {
      onSubmit(url);
      return;
    }
    if (!parseGitHubUrl(url)) {
      navigate("/create");
      return;
    }
    const project = await createFromUrl(url);
    if (project) navigate(`/create/generated/${project.id}`);
  }

  return (
    <div data-animate="hero" className="mt-6 sm:mt-8">
      <RepoUrlInput onSubmit={(url) => void handleSubmit(url)} buttonLabel="Remember this repo" />
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function HeroSection({ error, onSubmit }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="relative z-10 flex min-h-screen flex-col pt-20">
        <main className="mt-auto flex flex-col gap-6 px-5 pb-8 sm:gap-8 sm:px-8 sm:pb-12 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-16">
          <div className="max-w-xl">
            <h1
              data-animate="hero"
              className="text-3xl font-semibold leading-[1.1] tracking-tight text-[#010101] sm:text-4xl lg:text-[3.5rem] lg:text-white"
            >
              Bring dead software <span className="italic">back to life</span>
            </h1>
            <p
              data-animate="hero"
              className="mt-4 max-w-lg text-sm leading-relaxed text-[#010101]/70 sm:text-base lg:text-white/70"
            >
              We archive software with screenshots and dead links — even though software is meant
              to be experienced. {PRODUCT_NAME} rebuilds dormant repos in isolated sandboxes and
              turns them into prototypes anyone can use.
            </p>
            <HeroRepoInput error={error} onSubmit={onSubmit} />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 lg:gap-4">
            <div data-animate="hero">
              <StatsCard />
            </div>
            <div data-animate="hero">
              <TestimonialCard />
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}
