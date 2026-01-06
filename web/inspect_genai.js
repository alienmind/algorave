const genai = require('@google/genai');
console.log('Exports:', Object.keys(genai));

try {
    if (genai.GoogleGenAI) {
        console.log('GoogleGenAI is exported.');
        const client = new genai.GoogleGenAI({ apiKey: 'test' });
        console.log('Client instance keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
        // Inspect models module
        if (client.models) {
            console.log('client.models keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(client.models)));
        }
        // Inspect chats module
        if (client.chats) {
            console.log('client.chats keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(client.chats)));
            try {
                const chat = client.chats.create({ model: 'gemini-1.5-flash' });
                console.log('Chat instance keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(chat)));
                console.log('Chat properties:', Object.keys(chat));
            } catch (e) { console.log("Chat create error:", e.message); }
        }
    }
} catch (e) {
    console.error('Error inspecting client:', e);
}
