export default function Footer() {
  return (
    <footer className="flex flex-col gap-2 px-6 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-12">
      <p>© {new Date().getFullYear()} Aashish Pandey</p>
      <div className="flex gap-6">
        <a
          data-cursor-hover
          href="https://github.com/aashisharyan2595"
          className="hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
