import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export default async function TestPage() {
    const { data, error } = await supabase.from('categories').select('*').limit(5);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>

            <div className="space-y-4">
                <div className="p-4 rounded border bg-gray-50">
                    <h2 className="font-semibold mb-2">Configuration Check</h2>
                    <p>URL Configured: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No'}</p>
                    <p>Key Configured: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</p>
                </div>

                {error ? (
                    <div className="p-4 rounded border border-red-200 bg-red-50 text-red-800">
                        <h2 className="font-semibold mb-2">Connection Error</h2>
                        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(error, null, 2)}</pre>
                        <p className="mt-2 text-sm">
                            Please check your <code className="bg-red-100 px-1 rounded">.env.local</code> file and ensure the URL and Key are correct.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 rounded border border-green-200 bg-green-50 text-green-800">
                        <h2 className="font-semibold mb-2">Connection Successful!</h2>
                        <p className="mb-2">Retrieved {data?.length || 0} categories.</p>
                        <pre className="whitespace-pre-wrap text-sm bg-white p-2 rounded border overflow-auto max-h-60">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
