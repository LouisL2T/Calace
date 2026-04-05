# Calace - KI-Adaptive Business Platform

## Original Problem Statement
- Füge ein Backend hinzu und mache einen Demo-Button bei der Anmeldung
- Terminierungen müssen von einem bestimmten Tag bis zu dem nächsten Tag stattfinden
- Bei neuer Termin: Datum - Zuständiger Sachverständiger - Ansprechpartner (z.B. Autohaus) - diese Felder sollen oben in die Terminierung

## Architecture
- **Frontend**: Next.js 14 mit React, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python) - ursprünglich für PostgreSQL konfiguriert
- **Demo Mode**: Funktioniert mit Mock-Daten ohne Backend

## User Personas
- Dellendrücker / PDR-Techniker
- Lackierer
- KFZ-Werkstätten
- Allgemeine Dienstleister

## Core Requirements (Static)
1. Demo-Button auf der Anmeldeseite
2. KI-basiertes Onboarding zur Branchenanpassung
3. Kalender mit Terminverwaltung
4. Kundenverwaltung (CRM)
5. Zeiterfassung
6. Rechnungserstellung

## What's Been Implemented

### 2026-01-05
- ✅ Demo-Button existiert bereits auf Auth-Seite
- ✅ Erweiterte Terminfelder hinzugefügt:
  - Datum Von / Datum Bis (Datumsbereich)
  - Zuständiger Sachverständiger
  - Ansprechpartner (z.B. Autohaus)
- ✅ "Neuer Termin" Modal aktualisiert mit neuen Feldern oben
- ✅ Kalenderansicht zeigt neue Felder auf Terminen
- ✅ Mock-Daten aktualisiert mit Beispieldaten
- ✅ TypeScript Types erweitert

## Prioritized Backlog

### P0 (Kritisch)
- Backend auf MongoDB umstellen für echte Datenpersistenz

### P1 (Hoch)
- Echte Benutzerregistrierung und Login
- Termine in Datenbank speichern

### P2 (Mittel)
- Fahrzeugverwaltung vervollständigen
- Schadensdokumentation mit Foto-Upload
- PDF-Rechnungserstellung

## Next Tasks
1. Backend von PostgreSQL auf MongoDB migrieren
2. Auth-Endpoints mit MongoDB verbinden
3. Calendar-Endpoints implementieren
