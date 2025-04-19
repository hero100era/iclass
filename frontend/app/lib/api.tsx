import { getSession } from "./sessions";

async function ApiGET(request:Request, url="") {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    return response;
}

async function ApiPOST(request:Request, url="", data={}) {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        },
        body: JSON.stringify(data),
    });
    return response;
}

async function ApiPATCH(request:Request, url="", data={}) {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        },
        body: JSON.stringify(data),
    });
    return response;
}

async function ApiDELETE(request:Request, url="") {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        },
    });
    return response;
}

export {ApiGET, ApiPOST, ApiPATCH, ApiDELETE};