import { Form, redirect, Link, data, useFetcher } from "react-router";
import { ApiGET, ApiPOST } from '~/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import type { Route } from './+types/todos';
import { Button } from "~/components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
    const url = `${process.env.API_URL}/todos`;
    const response = await ApiGET(request, url)
    const todos = await response.json();
    if (!response.ok) {
        throw new Response('Failed to fetch todos', { status: response.status });
    }
    return { todos };
}

export async function action({ request }: Route.ActionArgs) {
    const url = `${process.env.API_URL}/todos`;
    const response = await ApiPOST(request, url, { task: "example data" });
    if (!response.ok) {
        throw data("Failed to create todo.", { status: 401 });
    }
    const todos = await response.json();
    const [todo] = todos;
    return redirect(`/todos/${todo.pk}/edit`)
}

export default function Todos({ loaderData }: Route.ComponentProps) {
    const { todos } = loaderData;
    return (
        <div>
            <h1>Todos</h1>
            <Form method="post">
                <Button type="submit" variant="outline">New</Button>
            </Form>
            <Table className="border-collapse border border-gray-300">
                <TableHeader>
                    <TableRow>
                        <TableHead className="border border-gray-300">
                            ID
                        </TableHead>
                        <TableHead className="border border-gray-300">
                            Task
                        </TableHead>
                        <TableHead className="border border-gray-300">
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        todos ? todos.map(({ pk, task }: { pk: number; task: string }) =>
                        (<TableRow key={pk}>
                            <TableCell className="border border-gray-300">
                                <Link to={`/todos/${pk}/edit`}>{pk}</Link>
                            </TableCell>
                            <TableCell className="border border-gray-300">
                                {task}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                                <DeleteTodo pk={pk} />
                            </TableCell>
                        </TableRow>)
                        ) : null}
                </TableBody>
            </Table>
        </div>
    );
}

function DeleteTodo({ pk }: { pk: number }) {
    const fetcher = useFetcher();
    return( <fetcher.Form method="post" action={`${pk}/delete`}>
        <Button type="submit" variant="secondary">Delete</Button>
    </fetcher.Form>);
}