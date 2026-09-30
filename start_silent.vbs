' ============================================================
'  RenGoFun — Chạy ngầm (Silent Launcher / VBScript)
'  Double-click file này để khởi động app mà KHÔNG hiện cửa sổ cmd đen.
' ============================================================

Dim strRoot, strPythonEngine, strVenvPython
Dim objShell, objFSO

Set objShell = CreateObject("WScript.Shell")
Set objFSO   = CreateObject("Scripting.FileSystemObject")

' Lấy thư mục chứa file .vbs này (tức là root của project)
strRoot        = objFSO.GetParentFolderName(WScript.ScriptFullName) & "\"
strPythonEngine = strRoot & "python_engine\"
strVenvPython   = strPythonEngine & "venv\Scripts\python.exe"

' --- Kiểm tra venv ---
If Not objFSO.FileExists(strVenvPython) Then
    MsgBox "Không tìm thấy môi trường ảo Python!" & vbCrLf & _
           "Đường dẫn mong đợi:" & vbCrLf & strVenvPython & vbCrLf & vbCrLf & _
           "Hãy chạy lệnh sau trong thư mục python_engine:" & vbCrLf & _
           "python -m venv venv", _
           vbCritical, "RenGoFun — Lỗi khởi động"
    WScript.Quit 1
End If

' --- Khởi động Python Backend (chạy ngầm, không hiện cửa sổ) ---
' WindowStyle = 0  → ẩn hoàn toàn
' bWaitOnReturn = False → không chờ lệnh kết thúc
Dim cmdPython
cmdPython = "cmd /c cd /d """ & strPythonEngine & """ && """ & _
            strVenvPython & """ -m uvicorn main:app --port 8000"
objShell.Run cmdPython, 0, False

' Chờ 3 giây để backend khởi động trước
WScript.Sleep 3000

' --- Khởi động Tauri Frontend (chạy ngầm) ---
Dim cmdTauri
cmdTauri = "cmd /c cd /d """ & strRoot & """ && npm run tauri dev"
objShell.Run cmdTauri, 0, False

' --- Thông báo nhẹ khi xong ---
' Dùng Popup thay MsgBox để tự đóng sau 4 giây (không cần bấm OK)
objShell.Popup "RenGoFun đang khởi động..." & vbCrLf & _
               "Backend: http://localhost:8000" & vbCrLf & _
               "Cửa sổ app sẽ tự xuất hiện sau vài giây.", _
               4, "RenGoFun — Đang chạy", 64

Set objShell = Nothing
Set objFSO   = Nothing
