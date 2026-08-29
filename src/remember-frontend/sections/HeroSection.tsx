import Image from "next/image";
import { useNavigate } from "react-router-dom";
import { RepoUrlInput } from "../components/RepoUrlInput";
import { PRODUCT_NAME, VIDEO_SRC } from "../constants";
import { parseGitHubUrl } from "../data/mock";
import { useProjects } from "../context/ProjectsContext";

function StatsCard() {
  return (
    <div className="hero-frost-plate p-5 sm:w-72 sm:p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/75">
        Market signal
      </p>
      <dl className="mt-4 space-y-4">
        <div>
          <dt className="name-stat-number text-2xl tracking-tight text-white">8,000+</dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-white/85">
            Vibe-coded projects already sit in a paid rescue market at roughly $50k–$500k per
            project
          </dd>
        </div>
        <div>
          <dt className="name-stat-number text-2xl tracking-tight text-white">$50–150B</dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-white/85">
            Estimated revenue loss per year from software that can&apos;t be run or maintained
          </dd>
        </div>
      </dl>
    </div>
  );
}

function TestimonialCard() {
  return (
    <div className="hero-frost-plate p-5 sm:w-72 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-white/30 bg-white/15 text-[9px] font-semibold text-white">
          MA
        </div>
        <span className="text-sm font-medium leading-snug text-white">Mohamed Aslam Abdul Gafoor</span>
      </div>
      <blockquote className="text-sm leading-relaxed text-white/90">
        &ldquo;We had screenshots and a broken deploy. {PRODUCT_NAME} rebuilt it in isolation and
        gave us a link our whole team could actually use.&rdquo;
      </blockquote>
      <div className="mt-4 flex items-center gap-3">
        <Image
          src="/aslam.jpg"
          alt="Mohamed Aslam Abdul Gafoor"
          width={36}
          height={36}
          className="h-9 w-9 rounded-full border border-white/20 object-cover"
        />
        <div>
          <p className="text-sm font-medium leading-snug text-white">Mohamed Aslam Abdul Gafoor</p>
          <p className="text-xs text-white/75">Builder</p>
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
      <RepoUrlInput
        onSubmit={(url) => void handleSubmit(url)}
        buttonLabel="Remember this repo"
        variant="archival"
      />
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

      <div className="hero-frost-overlay" aria-hidden />

      <div className="relative z-10 flex min-h-screen flex-col pt-20">
        <main className="mt-auto flex flex-col gap-6 px-5 pb-8 sm:gap-8 sm:px-8 sm:pb-12 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-16">
          <div className="max-w-xl">
            <h1
              data-animate="hero"
              className="text-3xl font-semibold leading-[1.1] tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-[3.5rem]"
            >
              Bring dead software <span className="italic">back to life</span>
            </h1>
            <p
              data-animate="hero"
              className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base"
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
