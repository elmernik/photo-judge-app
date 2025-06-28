import React, { useState } from 'react';
import { Upload, Camera, Star, ChevronRight, Sparkles, Award } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleChange = ({ target }) => {
    const selected = target.files?.[0];
    setFile(selected);
    setResults(null);
    setError(null);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      setResults(null);
      setError(null);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file, file.name);

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('http://localhost:8000/judge/', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const { detail } = await res.json();
        throw new Error(detail || 'Upload failed');
      }

      setResults(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'from-emerald-500 to-teal-500';
    if (score >= 6) return 'from-blue-500 to-cyan-500';
    if (score >= 4) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getScoreIcon = (score) => {
    if (score >= 8) return <Award className="w-5 h-5" />;
    if (score >= 6) return <Star className="w-5 h-5" />;
    return <Sparkles className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Nature Photography Judge
              </h1>
              <p className="text-gray-600 text-lg font-medium">AI-powered photo evaluation with detailed insights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12">
        {/* Upload Section */}
        <div className="max-w-4xl mx-auto">
          <div
            className={`relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border transition-all duration-300 hover:shadow-2xl ${
              dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="p-8">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Upload Area */}
                <div className="flex-1 w-full">
                  <label className={`group cursor-pointer block w-full p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                    dragOver 
                      ? 'border-blue-400 bg-blue-50/50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                  }`}>
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Drop your photo here
                      </h3>
                      <p className="text-gray-600 mb-4">
                        or click to browse files
                      </p>
                      <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                        <Camera className="w-4 h-4" />
                        JPG, PNG, WebP supported
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Action Button */}
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                  >
                    <div className="flex items-center gap-3">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Judge Photo
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </div>
                  </button>
                  
                  {file && (
                    <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                      {file.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Error occurred</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {(preview || results) && (
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Preview */}
              {preview && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    Your Photo
                  </h2>
                  <div className="relative group">
                    <img
                      src={preview}
                      alt="Selected"
                      className="w-full h-auto rounded-2xl shadow-2xl border border-gray-200/50 group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              )}

              {/* Results */}
              {results && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      Results
                    </h2>
                  </div>

                  {/* Overall Score */}
                  <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${getScoreColor(results.overall_score)} shadow-2xl text-white overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Overall Score</h3>
                        {getScoreIcon(results.overall_score)}
                      </div>
                      <div className="text-5xl font-bold mb-2">
                        {results.overall_score}
                        <span className="text-2xl font-normal opacity-80">/10</span>
                      </div>
                      <p className="text-white/90 font-medium">{results.filename}</p>
                    </div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">Detailed Analysis</h3>
                    <div className="grid gap-4">
                      {Object.entries(results.scores).map(([key, score], index) => (
                        <div
                          key={key}
                          className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-800 text-lg capitalize">
                              {key.replace(/_/g, ' ')}
                            </h4>
                            <div className="flex items-center gap-2">
                              {getScoreIcon(score)}
                              <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${getScoreColor(score)} text-white`}>
                                {score}/10
                              </span>
                            </div>
                          </div>
                          
                          {/* Score Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(score)} transition-all duration-1000 ease-out`}
                              style={{ width: `${(score / 10) * 100}%` }}
                            ></div>
                          </div>
                          
                          <p className="text-gray-600 leading-relaxed">
                            {results.rationales[key]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}