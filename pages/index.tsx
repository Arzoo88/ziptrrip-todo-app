import type { GetServerSideProps } from "next";

// Full-page (server-side) redirect to /todos — keeps this a classic
// multi-page app rather than a client-side SPA route change.
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/todos",
      permanent: false,
    },
  };
};

export default function Home() {
  return null;
}
