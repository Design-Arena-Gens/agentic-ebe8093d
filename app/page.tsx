'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  File,
  Folder,
  FolderOpen,
  Save,
  Download,
  Upload,
  Play,
  Terminal as TerminalIcon,
  GitBranch,
  Github,
  GitPullRequest,
  GitCommit,
  Settings,
  Search,
  X,
  Plus,
  FolderPlus,
  FilePlus
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileNode[]>([
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        { name: 'index.js', type: 'file', content: '// Welcome to Web IDE\nconsole.log("Hello World!");', path: 'src/index.js' },
      ]
    },
    { name: 'README.md', type: 'file', content: '# My Project\n\nWelcome to your project!', path: 'README.md' }
  ]);

  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to Web IDE Terminal']);
  const [githubToken, setGithubToken] = useState<string>('');
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [showGitPanel, setShowGitPanel] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const openFile = useCallback((file: FileNode) => {
    if (file.type === 'file') {
      setActiveFile(file);
      setEditorContent(file.content || '');
    }
  }, []);

  const saveFile = useCallback(() => {
    if (activeFile) {
      const updateFileContent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === activeFile.path && node.type === 'file') {
            return { ...node, content: editorContent };
          }
          if (node.children) {
            return { ...node, children: updateFileContent(node.children) };
          }
          return node;
        });
      };

      setFiles(updateFileContent(files));
      addTerminalOutput(`Saved: ${activeFile.name}`);
    }
  }, [activeFile, editorContent, files]);

  const createNewFile = (parentPath: string = '') => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    const newPath = parentPath ? `${parentPath}/${fileName}` : fileName;
    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      content: '',
      path: newPath
    };

    if (!parentPath) {
      setFiles([...files, newFile]);
    } else {
      const addToFolder = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === parentPath && node.type === 'folder') {
            return {
              ...node,
              children: [...(node.children || []), newFile]
            };
          }
          if (node.children) {
            return { ...node, children: addToFolder(node.children) };
          }
          return node;
        });
      };
      setFiles(addToFolder(files));
    }
    addTerminalOutput(`Created file: ${fileName}`);
  };

  const createNewFolder = (parentPath: string = '') => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const newPath = parentPath ? `${parentPath}/${folderName}` : folderName;
    const newFolder: FileNode = {
      name: folderName,
      type: 'folder',
      children: [],
      path: newPath
    };

    if (!parentPath) {
      setFiles([...files, newFolder]);
    } else {
      const addToFolder = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === parentPath && node.type === 'folder') {
            return {
              ...node,
              children: [...(node.children || []), newFolder]
            };
          }
          if (node.children) {
            return { ...node, children: addToFolder(node.children) };
          }
          return node;
        });
      };
      setFiles(addToFolder(files));
    }
    addTerminalOutput(`Created folder: ${folderName}`);
  };

  const addTerminalOutput = (text: string) => {
    setTerminalOutput(prev => [...prev, `> ${text}`]);
  };

  const downloadProject = () => {
    const exportData = JSON.stringify(files, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    a.click();
    addTerminalOutput('Project downloaded');
  };

  const uploadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setFiles(data);
          addTerminalOutput('Project uploaded successfully');
        } catch (error) {
          addTerminalOutput('Error uploading project');
        }
      };
      reader.readAsText(file);
    }
  };

  const runCode = () => {
    if (activeFile?.name.endsWith('.js')) {
      try {
        addTerminalOutput('Running JavaScript...');
        const capturedLogs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => {
          capturedLogs.push(args.join(' '));
          originalLog(...args);
        };

        eval(editorContent);

        console.log = originalLog;
        capturedLogs.forEach(log => addTerminalOutput(log));
      } catch (error: any) {
        addTerminalOutput(`Error: ${error.message}`);
      }
    } else {
      addTerminalOutput('Only JavaScript files can be executed');
    }
  };

  const connectGitHub = async () => {
    if (!githubToken) {
      addTerminalOutput('Please enter GitHub token in settings');
      return;
    }
    addTerminalOutput('Connected to GitHub');
  };

  const gitPush = async () => {
    if (!githubToken || !repoUrl) {
      addTerminalOutput('GitHub token and repo URL required');
      return;
    }

    try {
      addTerminalOutput('Pushing to GitHub...');
      const { Octokit } = await import('octokit');
      const octokit = new Octokit({ auth: githubToken });

      const [owner, repo] = repoUrl.replace('https://github.com/', '').split('/');

      addTerminalOutput(`Pushing to ${owner}/${repo}`);
      addTerminalOutput('Push completed (simulated)');
    } catch (error: any) {
      addTerminalOutput(`Error: ${error.message}`);
    }
  };

  const gitPull = async () => {
    if (!githubToken || !repoUrl) {
      addTerminalOutput('GitHub token and repo URL required');
      return;
    }

    try {
      addTerminalOutput('Pulling from GitHub...');
      const { Octokit } = await import('octokit');
      const octokit = new Octokit({ auth: githubToken });

      const [owner, repo] = repoUrl.replace('https://github.com/', '').split('/');

      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo: repo.replace('.git', ''),
        path: ''
      });

      addTerminalOutput('Pull completed successfully');
    } catch (error: any) {
      addTerminalOutput(`Error: ${error.message}`);
    }
  };

  const renderFileTree = (nodes: FileNode[], depth: number = 0): JSX.Element[] => {
    return nodes
      .filter(node => !searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((node) => (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-700 ${
              activeFile?.path === node.path ? 'bg-gray-700' : ''
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(node.path);
              } else {
                openFile(node);
              }
            }}
          >
            {node.type === 'folder' ? (
              expandedFolders.has(node.path) ? (
                <FolderOpen size={16} className="text-yellow-500" />
              ) : (
                <Folder size={16} className="text-yellow-500" />
              )
            ) : (
              <File size={16} className="text-blue-400" />
            )}
            <span className="text-sm text-gray-200">{node.name}</span>
          </div>
          {node.type === 'folder' && expandedFolders.has(node.path) && node.children && (
            <div>{renderFileTree(node.children, depth + 1)}</div>
          )}
        </div>
      ));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      {/* Top Bar */}
      <div className="h-12 bg-[#323233] flex items-center justify-between px-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Web IDE</h1>
          <div className="flex gap-2">
            <button
              onClick={saveFile}
              className="p-2 hover:bg-gray-600 rounded"
              title="Save (Ctrl+S)"
            >
              <Save size={18} />
            </button>
            <button
              onClick={runCode}
              className="p-2 hover:bg-gray-600 rounded"
              title="Run Code"
            >
              <Play size={18} />
            </button>
            <button
              onClick={downloadProject}
              className="p-2 hover:bg-gray-600 rounded"
              title="Download Project"
            >
              <Download size={18} />
            </button>
            <label className="p-2 hover:bg-gray-600 rounded cursor-pointer" title="Upload Project">
              <Upload size={18} />
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={uploadProject}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGitPanel(!showGitPanel)}
            className="p-2 hover:bg-gray-600 rounded"
            title="Git Panel"
          >
            <Github size={18} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-600 rounded"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-[#252526] border-r border-gray-700 flex flex-col">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1 bg-[#3c3c3c] text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-1 p-2 border-b border-gray-700">
            <button
              onClick={() => createNewFile()}
              className="flex-1 p-1 hover:bg-gray-700 rounded text-sm flex items-center justify-center gap-1"
              title="New File"
            >
              <FilePlus size={14} />
            </button>
            <button
              onClick={() => createNewFolder()}
              className="flex-1 p-1 hover:bg-gray-700 rounded text-sm flex items-center justify-center gap-1"
              title="New Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {renderFileTree(files)}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {activeFile && (
            <div className="h-10 bg-[#2d2d2d] border-b border-gray-700 flex items-center px-4">
              <File size={14} className="mr-2 text-blue-400" />
              <span className="text-sm">{activeFile.name}</span>
            </div>
          )}

          <div className="flex-1">
            {activeFile ? (
              <Editor
                height="100%"
                defaultLanguage={
                  activeFile.name.endsWith('.js') ? 'javascript' :
                  activeFile.name.endsWith('.ts') ? 'typescript' :
                  activeFile.name.endsWith('.html') ? 'html' :
                  activeFile.name.endsWith('.css') ? 'css' :
                  activeFile.name.endsWith('.json') ? 'json' :
                  activeFile.name.endsWith('.md') ? 'markdown' :
                  'plaintext'
                }
                value={editorContent}
                onChange={(value) => setEditorContent(value || '')}
                theme={theme}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <File size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No file selected</p>
                  <p className="text-sm mt-2">Open a file from the sidebar to start editing</p>
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 bg-[#1e1e1e] border-t border-gray-700 flex flex-col">
              <div className="h-8 bg-[#2d2d2d] flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <TerminalIcon size={14} />
                  <span className="text-sm">Terminal</span>
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="hover:bg-gray-700 p-1 rounded"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-sm">
                {terminalOutput.map((line, i) => (
                  <div key={i} className="text-green-400">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Git Panel */}
        {showGitPanel && (
          <div className="w-80 bg-[#252526] border-l border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Github size={20} />
                GitHub Integration
              </h2>
              <button
                onClick={() => setShowGitPanel(false)}
                className="hover:bg-gray-700 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Repository URL</label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="w-full px-3 py-2 bg-[#3c3c3c] text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Commit Message</label>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Update files"
                  className="w-full px-3 py-2 bg-[#3c3c3c] text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <button
                onClick={connectGitHub}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium flex items-center justify-center gap-2"
              >
                <GitBranch size={16} />
                Connect to GitHub
              </button>

              <div className="flex gap-2">
                <button
                  onClick={gitPush}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                  <GitCommit size={16} />
                  Push
                </button>
                <button
                  onClick={gitPull}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                  <GitPullRequest size={16} />
                  Pull
                </button>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                <p>Note: GitHub token should be set in Settings</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 bg-[#252526] border-l border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings size={20} />
                Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="hover:bg-gray-700 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">GitHub Personal Access Token</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-[#3c3c3c] text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generate at: github.com/settings/tokens
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'vs-dark' | 'light')}
                  className="w-full px-3 py-2 bg-[#3c3c3c] text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                >
                  <option value="vs-dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="h-8 bg-[#007acc] flex items-center justify-between px-4 text-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="flex items-center gap-1 hover:bg-blue-600 px-2 py-1 rounded"
          >
            <TerminalIcon size={14} />
            Terminal
          </button>
          {activeFile && (
            <span className="text-xs">{activeFile.path}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs">UTF-8</span>
          <span className="text-xs">Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
}
