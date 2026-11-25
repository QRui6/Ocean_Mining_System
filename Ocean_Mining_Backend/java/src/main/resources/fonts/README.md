# PDF 中文字体

`ReportSans-Regular.ttf` 是 Noto Sans SC 的静态 400 字重派生字体，按 SIL Open Font License 1.1 随服务分发；授权及原始版权声明见同目录 `OFL.txt`。字体在 PDF 中按实际使用字符子集嵌入，不依赖服务器系统字体或外部字体服务。

原始文件与授权：

- https://github.com/google/fonts/blob/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf
- https://github.com/google/fonts/blob/main/ofl/notosanssc/OFL.txt

转换方法：使用 fontTools 的 `instantiateVariableFont(font, {"wght": 400}, inplace=True)` 固化字重，将 family/full/PostScript 名称改为 Report Sans / ReportSans-Regular 后保存。未删减中文字符。升级字体时须保留授权文件，并重新执行 PDF 中文提取和页面渲染验证。
