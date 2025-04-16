import { ApiGET, ApiPATCH } from '~/lib/api';
import type { Route } from "./+types/edit-todo";
import { data, Form, redirect } from 'react-router';
import { Button } from '~/components/ui/button';

export async function loader({params, request}:Route.LoaderArgs) {
    const url = `${process.env.API_URL}/todos?pk=eq.${params.pk}`;
    const response = await ApiGET(request, url);
    const todos =await response.json();
    if ( !response.ok || todos.length === 0) {
        throw data("object not found.", { status: 404 });
    }
    return todos;
}

export async function action({params, request}:Route.ActionArgs) {
    const formData = await request.formData();
    const task = formData.get('task');
    const url = `${process.env.API_URL}/todos?pk=eq.${params.pk}`;
    const response =await ApiPATCH(request, url, { task: task });
    if (!response.ok) {
        throw data("not authorized to update todo.", {status: 401 });
    }
    const todos = await response.json();
    return redirect("/todos")
}

export default function EditTodo({ loaderData }:Route.ComponentProps) {
    const [todo] =  loaderData;
    return (
        <Form method="post">
            <div>
            <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">Task</label>
            <textarea id="task" name="task" defaultValue={todo.task} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
            </div>
            <Button variant='outline' type="submit" className="w-full py-2 px-4 rounded">Save</Button>
        </Form>
    );
}  

