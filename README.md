# Khmer Type Master

Build a modern Khmer Typing learning website that will later be integrated into krumath.com.

The UI should be clean, minimalist, responsive, and education-focused. Use the Modern Blue & White EdTech theme with #2563EB as the primary colour and subtle sky-blue gradients. Use Kantumruy Pro as the main Khmer font throughout the interface.

Use a wide left-side navigation/sidebar showing a clear progressive learning path from basic Khmer characters to advanced typing and assessment. Organise the curriculum into these 16 levels:

កម្រិតទី ១ — ជួរកណ្តាល និងព្យញ្ជនៈមិនប្រើ Shift: Home Row keys និងព្យញ្ជនៈមូលដ្ឋាន ដូចជា ក, ខ, ង, ច, ដ, ត, ន, ប, ម, ល, ស, ហ...

កម្រិតទី ២ — ព្យញ្ជនៈប្រើ Shift: ព្យញ្ជនៈដែលត្រូវប្រើ Shift ដូចជា ឃ, ឈ, ញ, ឋ, ឌ, ឍ, ណ, ថ, ធ, ភ, ឡ, អ...

កម្រិតទី ៣ — ស្រៈនិស្ស័យទូទៅ: ា, ិ, ី, ឹ, ឺ, ុ, ូ, ួ

កម្រិតទី ៤ — ស្រៈនិស្ស័យផ្សំ: ើ, ឿ, ៀ, េ, ែ, ៃ, ោ, ៅ, ុំ, ំ, ាំ, ះ និងការផ្សំគ្រាប់ចុច

កម្រិតទី ៥ — ជើងអក្សរទោល (Subscripts): យន្តការចុច j + ព្យញ្ជនៈ និងការផ្សំដូចជា ក្ក, ក្ខ, ខ្ល, ស្ម, ផ្អ...

កម្រិតទី ៦ — សញ្ញាបន្ថែម និងវណ្ណយុត្តិ: ់, ័, ៌, ៍, ៏, ៊, ៉, ។, ៗ

កម្រិតទី ៧ — ជើងអក្សរជាន់ និងពាក្យបាលី-សំស្ក្រឹត: ជើងតម្រួត និងព្យាង្គពិបាក ដូចជា កន្ត្រៃ, សង្គ្រោះ, មន្ត្រី, ឥន្ទ្រី...

កម្រិតទី ៨ — ស្រៈពេញតួ: ស្រៈដែលប្រើ Shift/AltGr ដូចជា ឰ, ឪ, ឫ, ឬ, ឭ, ឮ, ឯ, ឱ, ឳ, ឧ, ឩ

កម្រិតទី ៩ — លេខខ្មែរ និងនិមិត្តសញ្ញា: លេខ ០–៩, ៕, សញ្ញាគូសវាស, ៛ និងសញ្ញាដែលប្រើក្នុងការវាយអត្ថបទ

កម្រិតទី ១០ — ដកឃ្លាមើលមិនឃើញ (ZWSP) និងពាក្យទូទៅ: ការប្រើ Zero-Width Space និងពាក្យ ២–៣ ព្យាង្គ

កម្រិតទី ១១ — ប្រយោគខ្លីៗ និងសុភាសិត: ការផ្គុំពាក្យជាប្រយោគ និងឃ្លាខ្មែរដែលប្រើជាទូទៅ

កម្រិតទី ១២ — អត្ថបទរដ្ឋបាល និងឯកសារផ្លូវការ: លិខិតផ្លូវការ ពាក្យរដ្ឋបាល ច្បាប់ ការយោង និងឈ្មោះស្ថាប័ន

កម្រិតទី ១៣ — អក្សរសិល្ប៍ និងកំណាព្យខ្មែរ: កំណាព្យ បទកាកគតិ ពាក្យ៧ ពាក្យ៨ ពាក្យបុរាណ និងជើងតម្រួត

កម្រិតទី ១៤ — អត្ថបទព័ត៌មាន និងស្រាវជ្រាវ: អត្ថបទវែង ព័ត៌មាន បច្ចេកវិទ្យា វិទ្យាសាស្ត្រ និងវាក្យសព្ទបច្ចេកទេស

កម្រិតទី ១៥ — ចំណេះដឹងទូទៅ ស្ថិតិ និងទិន្នន័យ: Facts, insights, statistics, numbers, percentages, dates, tables, and analytical symbols

កម្រិតទី ១៦ — ការវាស់ល្បឿន និងភាពសុក្រឹត: Timed Capstone Exam measuring WPM, CPM, accuracy, mistakes, and overall typing performance

The main content area should provide an interactive typing-learning experience: target Khmer text, typing/input area, keyboard guidance, progress, accuracy, WPM/CPM, mistakes, and lesson completion. The experience should feel like a proper typing trainer, not simply a text input.

Use Unicode Khmer typing correctly, including Khmer character sequences, subscripts, vowels, diacritics, ZWSP, Shift/AltGr combinations, and other Unicode edge cases. Before creating a custom typing engine, investigate and reuse suitable free/open-source Khmer Unicode typing or keyboard libraries where practical rather than reinventing existing functionality.

Keep the curriculum, lessons, typing engine, keyboard mapping, exercises, and assessment logic modular so additional levels and content can easily be added later.

Prioritise excellent Khmer typography, Unicode correctness, simple navigation, clear progression, fast interaction, responsive/mobile usability, reusable components, and clean maintainable code.

Do not over-design it. The overall experience should feel modern, focused, educational, and polished.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
