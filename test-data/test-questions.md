# Test Questions for Quiz Application

## Pregunta 001

This is a simple test question with standard format.

**A**. Option A text
B. Option B text
C. Option C text
D. Option D text

<as-button label="Test Answer" message="A"></as-button>

## Pregunta 002

This question tests multiple correct answers.

A. First option
**B**. Second option (correct)
**C**. Third option (correct)
D. Fourth option

<as-button label="Test Answer" message="BC"></as-button>

## Pregunta 003

This question has mixed formatting in options.

**A**. Bold option A
B. Regular option B
*C*. Italic option C
D. **Mixed** formatting option

<as-button label="Test Answer" message="D"></as-button>

## Pregunta 004

Question with inquire attribute for additional answers.

A. Option A
B. Option B
C. Option C
D. Option D

<as-button label="Test Answer" message="A" inquire="C"></as-button>

## Pregunta 005

Question with longer content to test text handling.

This is a longer question that spans multiple lines and contains various formatting elements. It should test how well the parser handles extended content with different markdown elements.

A. This is a longer option text that might wrap to multiple lines in the interface
B. Short option
C. Another longer option with **bold text** and *italic text* mixed in
D. Final option

<as-button label="Test Answer" message="C"></as-button>