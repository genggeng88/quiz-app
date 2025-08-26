// src/lib/contact.ts
export type Contact = {
    id: string;
    subject: string;
    email: string;
    content: string;
    createdAtISO: string;  // auto-generated
};

const KEY = "contacts";

const uuid = () =>
    (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`.replace(".", "");

export function addContact(subject: string, email: string, content: string): Contact {
    const all = listContacts();
    const item: Contact = { id: uuid(), subject, email, content, createdAtISO: new Date().toISOString() };
    all.unshift(item); // newest first
    localStorage.setItem(KEY, JSON.stringify(all));
    return item;
}

export function listContacts(): Contact[] {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
}

export function getContact(id: string): Contact | null {
    return listContacts().find(c => c.id === id) ?? null;
}
