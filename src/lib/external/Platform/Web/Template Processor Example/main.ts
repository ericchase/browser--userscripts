import { LoadIncludeFile, ProcessTemplateFile } from '../Template Processor.js';

await LoadIncludeFile('button', './component/button.html');
await ProcessTemplateFile('./index.template.html', './index.html');
