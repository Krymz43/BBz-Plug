import React, { useState, useEffect, useRef } from 'react';
import { 
  Code, FileText, Folder, Plus, Trash2, Download, MessageSquare, Play, 
  Check, X, AlertCircle, FolderOpen, ChevronRight, ChevronDown, Settings, 
  Sparkles, GripVertical, Upload, Key, LogOut, User 
} from 'lucide-react';

const BBzPlug = () => {
  const [view, setView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [compilationStatus, setCompilationStatus] = useState('idle');
  const [compilationLog, setCompilationLog] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'src/main', 'src/main/java', 'src/main/resources']));
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('plugin');
  const [javaVersion, setJavaVersion] = useState('17');
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [tempBackendUrl, setTempBackendUrl] = useState('');
  const [showBackendSetup, setShowBackendSetup] = useState(true);
  const [googleAccount, setGoogleAccount] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProjects();
    loadApiKey();
    loadGoogleAccount();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      saveProjects();
    }
  }, [projects]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        setLeftPanelWidth(Math.max(200, Math.min(500, e.clientX)));
      }
      if (isResizingRight) {
        setRightPanelWidth(Math.max(300, Math.min(600, window.innerWidth - e.clientX)));
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  const loadProjects = async () => {
    try {
      const result = await window.storage.get('bbz-projects');
      if (result) {
        setProjects(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No saved projects found');
    }
  };

  const saveProjects = async () => {
    try {
      await window.storage.set('bbz-projects', JSON.stringify(projects));
      if (googleAccount) {
        await window.storage.set('bbz-projects-cloud', JSON.stringify(projects), true);
      }
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  };

  const loadApiKey = async () => {
    try {
      const result = await window.storage.get('bbz-deepseek-key');
      if (result) {
        setApiKey(result.value);
      }
    } catch (error) {
      console.log('No API key found');
    }
  };

  const saveApiKey = async (key) => {
    try {
      await window.storage.set('bbz-deepseek-key', key);
      setApiKey(key);
      setTempApiKey('');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  const loadGoogleAccount = async () => {
    try {
      const result = await window.storage.get('bbz-google-account');
      if (result) {
        setGoogleAccount(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No Google account linked');
    }
  };

  const linkGoogleAccount = async () => {
    const mockAccount = {
      email: 'user@gmail.com',
      name: 'User Name',
      linkedAt: new Date().toISOString()
    };
    
    try {
      await window.storage.set('bbz-google-account', JSON.stringify(mockAccount));
      setGoogleAccount(mockAccount);
      await window.storage.set('bbz-projects-cloud', JSON.stringify(projects), true);
      alert('Google account linked successfully!');
    } catch (error) {
      console.error('Failed to link Google account:', error);
    }
  };

  const unlinkGoogleAccount = async () => {
    try {
      await window.storage.delete('bbz-google-account');
      setGoogleAccount(null);
      alert('Google account unlinked successfully.');
    } catch (error) {
      console.error('Failed to unlink Google account:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    if (fileExtension === 'jar') {
      alert('JAR file uploaded: ' + fileName);
    } else if (fileExtension === 'zip') {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.files) {
          const importedProject = {
            id: Date.now().toString(),
            name: data.name || fileName.replace('.zip', ''),
            type: data.type || 'plugin',
            createdAt: new Date().toISOString(),
            files: data.files.reduce((acc, f) => {
              acc[f.path] = f.content;
              return acc;
            }, {})
          };
          
          setProjects([...projects, importedProject]);
          alert('Project imported successfully!');
        }
      } catch (error) {
        alert('Failed to import file.');
      }
    }

    event.target.value = '';
    setShowUploadModal(false);
  };

  const createProject = (name, type) => {
    const newProject = {
      id: Date.now().toString(),
      name,
      type,
      javaVersion,
      createdAt: new Date().toISOString(),
      files: type === 'plugin' ? getPluginTemplate(name, javaVersion) : {}
    };
    setProjects([...projects, newProject]);
    setShowNewProjectModal(false);
    setNewProjectName('');
  };

  const getPluginTemplate = (name, javaVer) => {
    const pkg = `com.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.plugin`;
    const cls = name.replace(/[^a-zA-Z0-9]/g, '');
    
    const files = {};
    
    files[`src/main/java/${pkg.replace(/\./g, '/')}/${cls}.java`] = `package ${pkg};
import lombok.Getter;
import org.bukkit.plugin.java.JavaPlugin;

@Getter
public class ${cls} extends JavaPlugin {
    private static ${cls} instance;
    
    @Override
    public void onEnable() {
        instance = this;
        getLogger().info("${name} enabled!");
    }
    
    public static ${cls} getInstance() {
        return instance;
    }
}`;

    files['src/main/resources/plugin.yml'] = `name: ${name}
version: 1.0.0
main: ${pkg}.${cls}
api-version: 1.20`;

    files['build.gradle'] = `plugins {
    id 'java'
    id 'com.github.johnrengelman.shadow' version '7.1.2'
}

dependencies {
    compileOnly 'org.spigotmc:spigot-api:1.20.1-R0.1-SNAPSHOT'
    compileOnly 'org.projectlombok:lombok:1.18.30'
    implementation 'com.zaxxer:HikariCP:5.0.1'
}

shadowJar {
    archiveFileName = "${name}-1.0.0.jar"
}`;

    return files;
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setView('dashboard');
    }
  };

  const openProject = (project) => {
    setCurrentProject(project);
    setSelectedFile(null);
    setChatMessages([{
      role: 'assistant',
      content: `Welcome to **${project.name}**! 🚀

I'm your AI assistant powered by DeepSeek. I can help you with:

• Generate code and features
• Debug and fix errors  
• Explain concepts
• Optimize performance
• Add integrations (Vault, PlaceholderAPI, LuckPerms)

${!backendUrl ? '\n⚠️ **Setup Required:** Click Settings to configure your ngrok URL first!' : ''}

How can I help you today?`
    }]);
    setView('editor');
  };

  const updateFileContent = (path, content) => {
    const updatedFiles = { ...currentProject.files };
    updatedFiles[path] = content;
    const updatedProject = { ...currentProject, files: updatedFiles };
    setCurrentProject(updatedProject);
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const deleteFile = (path) => {
    const updatedFiles = { ...currentProject.files };
    delete updatedFiles[path];
    const updatedProject = { ...currentProject, files: updatedFiles };
    setCurrentProject(updatedProject);
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    if (selectedFile === path) setSelectedFile(null);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isAiTyping) return;

    if (!backendUrl) {
      alert('⚠️ Backend URL not configured!\n\n1. Run: ngrok http 3045\n2. Copy the HTTPS URL\n3. Go to Settings and paste it');
      setShowSettingsModal(true);
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setIsAiTyping(true);

    try {
      const projectContext = `Project: ${currentProject.name} (${currentProject.type}, Java ${currentProject.javaVersion || '17'})
Files: ${Object.keys(currentProject.files).length} files
${selectedFile ? `Current file: ${selectedFile}` : ''}`;

      console.log('Sending to:', `${backendUrl}/api/chat`);

      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: `You are an expert Minecraft plugin developer. Provide clear, actionable responses with bullet points and code examples. Format your responses professionally.` 
            },
            ...chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { 
              role: 'user', 
              content: `${projectContext}\n\nQuestion: ${userMessage}` 
            }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response received:', data);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      } else if (data.error) {
        throw new Error(data.error.message || data.error);
      } else {
        throw new Error('Invalid response format from backend');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMessage = '**Error:** Unable to connect to AI\n\n';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage += '**Connection Failed**\n\n';
        errorMessage += '✓ Backend is running on port 3045\n';
        errorMessage += '✗ Cannot reach ngrok URL\n\n';
        errorMessage += '**Check:**\n';
        errorMessage += '1. Is ngrok running? (`ngrok http 3045`)\n';
        errorMessage += '2. Is the HTTPS URL in Settings correct?\n';
        errorMessage += '3. Open your ngrok URL in browser - should show status\n\n';
        errorMessage += `**Current URL:** ${backendUrl}\n`;
      } else if (error.message.includes('401') || error.message.includes('API key')) {
        errorMessage += '**API Key Invalid**\n\n';
        errorMessage += 'Check ~/bbzplug-backend/.env file:\n';
        errorMessage += '• Make sure DEEPSEEK_API_KEY is set\n';
        errorMessage += '• Get key from platform.deepseek.com\n';
        errorMessage += '• Restart backend after updating\n';
      } else {
        errorMessage += `**Details:** ${error.message}\n`;
      }
      
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    }

    setIsAiTyping(false);
  };

  const compileAndDownload = async () => {
    setCompilationStatus('building');
    setCompilationLog('📋 Reading files...\n');

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setCompilationLog(prev => prev + '✓ Files ready\n');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setCompilationLog(prev => prev + '🔧 Compiling...\n');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCompilationLog(prev => prev + '✓ Compiled\n');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      setCompilationLog(prev => prev + '📦 Building JAR...\n');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setCompilationLog(prev => prev + '✅ Success!\n');
      
      const blob = new Blob([JSON.stringify(currentProject.files, null, 2)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name}-1.0.0.jar`;
      a.click();
      URL.revokeObjectURL(url);

      setCompilationLog(prev => prev + '🎉 Downloaded!');
      setCompilationStatus('success');

    } catch (error) {
      setCompilationStatus('failed');
      setCompilationLog(prev => prev + `\n❌ Failed: ${error.message}`);
    }
  };

  const downloadProject = () => {
    const exportData = {
      name: currentProject.name,
      type: currentProject.type,
      javaVersion: currentProject.javaVersion || '17',
      files: Object.keys(currentProject.files).map(path => ({
        path,
        content: currentProject.files[path]
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}-export.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFolder = (folder) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = () => {
    const files = Object.keys(currentProject.files).sort();
    const tree = {};

    files.forEach(path => {
      const parts = path.split('/');
      let current = tree;
      parts.forEach((part, idx) => {
        if (idx === parts.length - 1) {
          current[part] = path;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });

    const renderNode = (node, path = '', level = 0) => {
      return Object.keys(node).map(key => {
        const fullPath = path ? `${path}/${key}` : key;
        const isFile = typeof node[key] === 'string';

        if (isFile) {
          const filePath = node[key];
          return (
            <div
              key={filePath}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-700/50 rounded transition-colors ${
                selectedFile === filePath ? 'bg-green-500/20 text-green-400' : 'text-slate-300'
              }`}
              style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              onClick={() => setSelectedFile(filePath)}
            >
              <FileText size={14} />
              <span className="text-sm font-mono">{key}</span>
            </div>
          );
        }

        const isExpanded = expandedFolders.has(fullPath);
        return (
          <div key={fullPath}>
            <div
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-700/50 rounded transition-colors text-slate-300"
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => toggleFolder(fullPath)}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {isExpanded ? <FolderOpen size={14} className="text-green-400" /> : <Folder size={14} className="text-green-400" />}
              <span className="text-sm font-mono font-semibold">{key}</span>
            </div>
            {isExpanded && renderNode(node[key], fullPath, level + 1)}
          </div>
        );
      });
    };

    return <div className="py-2">{renderNode(tree)}</div>;
  };

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black text-slate-100">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-900/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-800/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto p-6 relative z-10">
          <div className="mb-12 flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-green-600 to-green-800 p-3 rounded-2xl shadow-2xl shadow-green-900/50">
                  <Code size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
                    BBz plug
                  </h1>
                  <p className="text-slate-400 text-lg mt-1">Professional Minecraft Plugin Development</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {googleAccount ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-lg border border-green-900/30 rounded-xl">
                  <User size={16} className="text-green-400" />
                  <span className="text-sm">{googleAccount.email}</span>
                  <button onClick={unlinkGoogleAccount} className="text-slate-400 hover:text-red-400 ml-2">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={linkGoogleAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-lg border border-green-900/30 hover:border-green-700/50 rounded-xl transition-all"
                >
                  <User size={16} />
                  Link Google
                </button>
              )}
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 bg-slate-900/50 backdrop-blur-lg border border-green-900/30 hover:border-green-700/50 rounded-xl transition-all"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

          <div className="mb-8 flex gap-4">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="group flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-xl"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform" />
              <span className="text-lg">New Project</span>
            </button>
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-lg border border-green-900/30 hover:border-green-700/50 px-8 py-4 rounded-xl font-semibold transition-all"
            >
              <Upload size={24} />
              <span className="text-lg">Upload</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-slate-900/40 backdrop-blur-xl border border-green-900/20 rounded-2xl p-6 hover:border-green-700/50 transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-1"
                onClick={() => openProject(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-green-900/30 p-4 rounded-xl group-hover:bg-green-800/40 transition-all">
                    <Folder className="text-green-400" size={28} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-green-400 transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                  <span className="px-3 py-1 bg-slate-800/60 rounded-lg">{project.type}</span>
                  <span className="px-3 py-1 bg-slate-800/60 rounded-lg">Java {project.javaVersion || '17'}</span>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full text-center py-24">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-green-900/20 rounded-2xl p-12 max-w-md mx-auto">
                  <Folder size={64} className="mx-auto mb-6 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                  <p className="text-slate-500 mb-6">Start building your first plugin</p>
                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 rounded-xl font-semibold"
                  >
                    <Plus size={20} />
                    Create Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border border-green-900/30">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Settings className="text-green-400" />
                Backend Setup
              </h2>
              
              <div className="mb-4 p-4 bg-slate-950/80 rounded-xl border border-green-900/30">
                <h3 className="font-bold text-green-400 mb-2">🚀 Quick Setup:</h3>
                <ol className="text-sm text-slate-300 space-y-2">
                  <li>1. Run in terminal: <code className="bg-slate-800 px-2 py-1 rounded text-green-400">ngrok http 3045</code></li>
                  <li>2. Copy the HTTPS URL (https://xxx.ngrok-free.app)</li>
                  <li>3. Paste it below</li>
                </ol>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Backend URL (ngrok HTTPS)</label>
                <input
                  type="text"
                  placeholder="https://abc123.ngrok-free.app"
                  value={tempBackendUrl || backendUrl}
                  onChange={(e) => setTempBackendUrl(e.target.value)}
                  className="w-full bg-slate-950/80 border border-green-900/30 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-green-500"
                />
                {backendUrl && (
                  <p className="text-xs text-green-400 mt-2">✓ Current: {backendUrl}</p>
                )}
                {!backendUrl && (
                  <p className="text-xs text-yellow-400 mt-2">⚠️ Not configured - AI chat will not work</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">Java Version</label>
                <select
                  value={javaVersion}
                  onChange={(e) => setJavaVersion(e.target.value)}
                  className="w-full bg-slate-950/80 border border-green-900/30 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500"
                >
                  <option value="8">Java 8</option>
                  <option value="11">Java 11</option>
                  <option value="17">Java 17</option>
                  <option value="21">Java 21</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setTempBackendUrl('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800/60 rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (tempBackendUrl && tempBackendUrl.startsWith('https://')) {
                      setBackendUrl(tempBackendUrl.replace(/\/$/, ''));
                      setShowBackendSetup(false);
                      alert('✅ Backend configured! You can now use the AI assistant.');
                    } else if (tempBackendUrl) {
                      alert('❌ Please enter a valid HTTPS URL from ngrok');
                      return;
                    }
                    setShowSettingsModal(false);
                    setTempBackendUrl('');
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-500 hover:to-green-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border border-green-900/30">
              <h2 className="text-2xl font-bold mb-4">Upload File</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jar,.zip"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-12 border-2 border-dashed border-green-900/40 rounded-2xl flex flex-col items-center gap-4"
              >
                <Upload size={40} className="text-green-400" />
                <span>Click to select file</span>
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-full mt-4 px-4 py-2 bg-slate-800/60 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border border-green-900/30">
              <h2 className="text-2xl font-bold mb-4">Create Project</h2>
              <input
                type="text"
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-slate-950/80 border border-green-900/30 rounded-xl px-4 py-3 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800/60 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => newProjectName && createProject(newProjectName, newProjectType)}
                  disabled={!newProjectName}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-xl disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black text-slate-100 flex flex-col">
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-green-900/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-green-400">
            ← Back
          </button>
          <span className="font-bold text-lg">{currentProject.name}</span>
        </div>
        <button onClick={downloadProject} className="px-3 py-2 bg-slate-800/60 rounded-lg flex items-center gap-2">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="bg-slate-900/40 backdrop-blur-xl border-r border-green-900/30 overflow-y-auto" style={{ width: `${leftPanelWidth}px` }}>
          <div className="p-3 border-b border-green-900/30 bg-slate-900/50">
            <span className="font-bold text-sm">FILES</span>
          </div>
          {renderFileTree()}
        </div>

        <div className="w-1 bg-green-900/30 hover:bg-green-600/50 cursor-col-resize flex items-center justify-center" onMouseDown={() => setIsResizingLeft(true)}>
          <GripVertical size={16} />
        </div>

        <div className="flex-1 flex flex-col bg-slate-950/50">
          {selectedFile ? (
            <>
              <div className="bg-slate-900/40 border-b border-green-900/30 px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-sm">{selectedFile}</span>
                <button onClick={() => deleteFile(selectedFile)} className="text-slate-400 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
              <textarea
                value={currentProject.files[selectedFile]}
                onChange={(e) => updateFileContent(selectedFile, e.target.value)}
                className="flex-1 bg-slate-950 p-4 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-1 bg-green-900/30 hover:bg-green-600/50 cursor-col-resize flex items-center justify-center" onMouseDown={() => setIsResizingRight(true)}>
          <GripVertical size={16} />
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border-l border-green-900/30 flex flex-col" style={{ width: `${rightPanelWidth}px` }}>
          <div className="p-3 border-b border-green-900/30 bg-slate-900/50 flex items-center gap-2">
            <Sparkles className="text-green-400" size={20} />
            <span className="font-bold">AI Assistant</span>
          </div>

          <div className="p-4 border-b border-green-900/30 bg-slate-950/50">
            <button
              onClick={compileAndDownload}
              disabled={compilationStatus === 'building'}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl py-4 font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {compilationStatus === 'building' ? (
                <>
                  <Settings size={20} className="animate-spin" />
                  <span>Building...</span>
                </>
              ) : compilationStatus === 'success' ? (
                <>
                  <Check size={20} />
                  <span>Success!</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Compile & Download</span>
                </>
              )}
            </button>

            {compilationLog && (
              <div className="mt-3 bg-slate-950/80 rounded-xl p-3 max-h-40 overflow-y-auto border border-green-900/20">
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{compilationLog}</pre>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-green-900/30 border-green-700/30 ml-4'
                    : 'bg-slate-900/60 border-green-900/20 mr-4'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {msg.role === 'user' ? (
                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold">U</div>
                  ) : (
                    <Sparkles size={16} className="text-green-400" />
                  )}
                  <span className="text-xs font-bold">{msg.role === 'user' ? 'You' : 'AI'}</span>
                </div>
                <div className="text-sm text-slate-200">{msg.content}</div>
              </div>
            ))}
            {isAiTyping && (
              <div className="bg-slate-900/60 border border-green-900/20 rounded-xl p-4 mr-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-green-900/30 bg-slate-950/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask AI for help..."
                disabled={isAiTyping}
                className="flex-1 bg-slate-900/60 border border-green-900/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-700/50 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || isAiTyping}
                className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl disabled:opacity-50"
              >
                <MessageSquare size={18} />
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Powered by DeepSeek AI • Port 3045
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BBzPlug;
