import { ApiDELETE } from "~/lib/api";
import type { Route } from "./+types/delete-todo";
import { data } from "react-router";

export async function action({request, params}:Route.ActionArgs) {
    const pk = params.pk;
    const url = `${process.env.API_URL}/todos?pk=eq.${pk}`;
    const response = await ApiDELETE(request, url);
    const todos = await response.json();
    if (!response.ok || todos.length === 0) {
        throw data(`not authorized to delete todo.`, {status: 401 });
    }
    const todo = todos[0];
    return { todo };
}

