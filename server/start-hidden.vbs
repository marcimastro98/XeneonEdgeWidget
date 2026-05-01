Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverPath = scriptDir & "\server.js"
shell.CurrentDirectory = scriptDir
shell.Run "cmd /c node """ & serverPath & """", 0, False
