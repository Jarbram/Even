import { EntrarForm } from "./entrar-form";

export default function EntrarPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-[22px]">
      <h1 className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.5px]">
        ¿Quién eres?
      </h1>
      <p className="mt-3 mb-7 text-sm text-muted-foreground">
        Entra con tu PIN. Queda guardado en este dispositivo.
      </p>
      <EntrarForm />
    </main>
  );
}
