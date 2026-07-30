export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12">
      <div className="mb-10">
        <div className="mb-5 size-11 rounded-full bg-gradient-to-br from-secondary to-primary" />
        <h1 className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.5px] text-foreground">
          Nuestro
          <br />
          Presupuesto
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Los gastos de la casa, sin hoja de cálculo.
        </p>
      </div>
      {children}
    </main>
  );
}
