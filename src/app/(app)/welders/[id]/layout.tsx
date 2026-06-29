export default function WelderProfileLayout({
  children,
  qualifications,
}: {
  children: React.ReactNode;
  qualifications: React.ReactNode;
}) {
  return (
    <>
      {children}
      <div className="px-8 pb-8">{qualifications}</div>
    </>
  );
}
