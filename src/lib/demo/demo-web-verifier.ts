import type { VerificationInput, VerificationResult, WebVerifier } from "@/lib/resurrection/verify";

const DEMO_PORT = 3000;
const DEMO_VERIFICATION_DELAY_MS = 20;

export class DemoWebVerifier implements WebVerifier {
  public async verify(_input: VerificationInput): Promise<VerificationResult> {
    void _input;
    await demoVerificationDelay();
    return {
      httpStatus: 200,
      isVerified: true,
      port: DEMO_PORT,
      previewUrl: "https://demo.invalid/preview",
      processAlive: true,
      stderr: "",
      stdout: "Demo Next.js server verified.",
    };
  }
}

const demoVerificationDelay = async (): Promise<void> => {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, DEMO_VERIFICATION_DELAY_MS);
  });
};
