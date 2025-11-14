import { Form } from "react-router";
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <>
      <Welcome />
      <Form
        method="post"
        action="/logout"
        className="flex items-center justify-center pt-16 pb-4"
      >
        <button type="submit" className="bg-sky-500 hover:bg-sky-700">
          Logout
        </button>
      </Form>
    </>
  );
}
