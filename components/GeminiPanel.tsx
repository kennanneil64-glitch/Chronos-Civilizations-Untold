import React, { useState } from 'react';
import { getAdvisorResponse, generateGameAsset, editGameSnapshot } from '../services/geminiService';
import { GameState } from '../types';
import { Sparkles, Image as ImageIcon, MessageSquare, Camera, Edit2, Loader2, Wand2 } from 'lucide-react';

interface GeminiPanelProps {
    gameState: GameState;
}

type Tab = 'advisor' | 'generate' | 'edit';

export const GeminiPanel = ({ gameState }: GeminiPanelProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('advisor');
    const [isLoading, setIsLoading] = useState(false);
    
    // Advisor State
    const [advisorInput, setAdvisorInput] = useState('');
    const [advisorLog, setAdvisorLog] = useState<{role: 'user' | 'ai', text: string}[]>([
        {role: 'ai', text: 'Greetings, ruler. I await your command.'}
    ]);

    // Generator State
    const [genPrompt, setGenPrompt] = useState('');
    const [genSize, setGenSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Editor State
    const [snapshot, setSnapshot] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [editedImage, setEditedImage] = useState<string | null>(null);

    const handleAdvisorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!advisorInput.trim()) return;

        const userMsg = advisorInput;
        setAdvisorLog(prev => [...prev, {role: 'user', text: userMsg}]);
        setAdvisorInput('');
        setIsLoading(true);

        const context = `Act: ${gameState.act}. Resources: ${JSON.stringify(gameState.inventory)}. Turn: ${gameState.turn}.`;
        const response = await getAdvisorResponse(context, userMsg);
        
        setAdvisorLog(prev => [...prev, {role: 'ai', text: response}]);
        setIsLoading(false);
    };

    const handleGenerate = async () => {
        if (!genPrompt) return;
        setIsLoading(true);
        const result = await generateGameAsset(genPrompt, genSize);
        setGeneratedImage(result);
        setIsLoading(false);
    };

    const takeSnapshot = () => {
        const canvas = document.querySelector('#game-canvas canvas') as HTMLCanvasElement;
        if (canvas) {
            setSnapshot(canvas.toDataURL('image/png'));
            setEditedImage(null);
        }
    };

    const handleEdit = async () => {
        if (!snapshot || !editPrompt) return;
        setIsLoading(true);
        const result = await editGameSnapshot(snapshot, editPrompt);
        setEditedImage(result);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-md border-l border-slate-700 text-slate-100 w-96 shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                <button 
                    onClick={() => setActiveTab('advisor')}
                    className={`flex-1 p-3 flex justify-center items-center gap-2 hover:bg-slate-800 transition ${activeTab === 'advisor' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
                >
                    <MessageSquare size={18} /> Advisor
                </button>
                <button 
                    onClick={() => setActiveTab('generate')}
                    className={`flex-1 p-3 flex justify-center items-center gap-2 hover:bg-slate-800 transition ${activeTab === 'generate' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'}`}
                >
                    <ImageIcon size={18} /> Vision
                </button>
                <button 
                    onClick={() => setActiveTab('edit')}
                    className={`flex-1 p-3 flex justify-center items-center gap-2 hover:bg-slate-800 transition ${activeTab === 'edit' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
                >
                    <Edit2 size={18} /> Edit
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* ADVISOR TAB */}
                {activeTab === 'advisor' && (
                    <>
                        <div className="flex-1 space-y-3 mb-4 min-h-[200px]">
                            {advisorLog.map((msg, idx) => (
                                <div key={idx} className={`p-3 rounded-lg text-sm ${msg.role === 'ai' ? 'bg-slate-800 border border-slate-700' : 'bg-blue-900/30 ml-8 text-right'}`}>
                                    {msg.text}
                                </div>
                            ))}
                            {isLoading && <div className="text-xs text-slate-500 animate-pulse">Consulting the archives...</div>}
                        </div>
                        <form onSubmit={handleAdvisorSubmit} className="mt-auto flex gap-2">
                            <input 
                                value={advisorInput}
                                onChange={e => setAdvisorInput(e.target.value)}
                                placeholder="Ask for strategy..."
                                className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 rounded p-2 transition">
                                <Sparkles size={16} />
                            </button>
                        </form>
                    </>
                )}

                {/* GENERATE TAB */}
                {activeTab === 'generate' && (
                    <div className="space-y-4">
                        <div className="bg-slate-800 p-3 rounded text-xs text-slate-400 border-l-2 border-purple-500">
                            Create concept art for wonders, leaders, or events.
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Prompt</label>
                            <textarea 
                                value={genPrompt}
                                onChange={e => setGenPrompt(e.target.value)}
                                placeholder="A futuristic city with flying cars..."
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm h-24 mt-1 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['1K', '2K', '4K'].map((s) => (
                                <button 
                                    key={s}
                                    onClick={() => setGenSize(s as any)}
                                    className={`flex-1 text-xs py-1 rounded border ${genSize === s ? 'bg-purple-600 border-purple-500' : 'bg-transparent border-slate-700'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-2 rounded font-bold text-sm flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>}
                            Generate
                        </button>
                        {generatedImage && (
                            <div className="mt-4 border border-slate-700 rounded overflow-hidden">
                                <img src={generatedImage} alt="Generated" className="w-full h-auto" />
                                <a href={generatedImage} download="generated_asset.png" className="block text-center bg-slate-800 text-xs py-1 hover:bg-slate-700">Download</a>
                            </div>
                        )}
                    </div>
                )}

                {/* EDIT TAB */}
                {activeTab === 'edit' && (
                    <div className="space-y-4">
                        <div className="bg-slate-800 p-3 rounded text-xs text-slate-400 border-l-2 border-emerald-500">
                            Capture the current view and use AI to reimagine it.
                        </div>
                        
                        {!snapshot ? (
                            <button 
                                onClick={takeSnapshot}
                                className="w-full h-32 border-2 border-dashed border-slate-600 rounded flex flex-col items-center justify-center hover:bg-slate-800/50 transition cursor-pointer"
                            >
                                <Camera size={24} className="mb-2 text-emerald-400"/>
                                <span className="text-sm">Capture Current View</span>
                            </button>
                        ) : (
                            <div className="relative group">
                                <img src={snapshot} alt="Snapshot" className="w-full rounded border border-slate-600 opacity-70" />
                                <button onClick={() => setSnapshot(null)} className="absolute top-1 right-1 bg-red-600/80 p-1 rounded text-xs hover:bg-red-500">Retake</button>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Edit Instruction</label>
                            <input 
                                value={editPrompt}
                                onChange={e => setEditPrompt(e.target.value)}
                                placeholder="Make it look like a cyberpunk city..."
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm mt-1 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <button 
                            onClick={handleEdit}
                            disabled={isLoading || !snapshot}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-2 rounded font-bold text-sm flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Edit2 size={16}/>}
                            Process Edit
                        </button>

                         {editedImage && (
                            <div className="mt-4 border border-emerald-700 rounded overflow-hidden shadow-emerald-900/20 shadow-lg">
                                <div className="bg-emerald-900/30 p-1 text-center text-xs font-bold text-emerald-300">RESULT</div>
                                <img src={editedImage} alt="Edited" className="w-full h-auto" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
