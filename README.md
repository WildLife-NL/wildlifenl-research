# ResearchConnect

Welcome to the official GitHub repository of **ResearchConnect** for **WildlifeNL**. ResearchConnect serves as a research portal designed to facilitate the creation and management of experiments. In these experiments, researchers can create questionnaires and messages that will be sent when certain conditions are met to collect data for their research. The collected data from these experiments can also be exported in CSV format for further analysis. For more detailed instructions, please refer to the [Docs](./Docs) folder.

## Deployment

ResearchConnect runs as two instances, both built from the `Dockerfile`. The API is chosen at build time with the `REACT_APP_BASE_URL` build argument, which defaults to the LIVE API.

| Instance | URL | Build |
| --- | --- | --- |
| LIVE | researchconnect.wildlifenl.nl | `docker build .` |
| TEST | test-researchconnect.wildlifenl.nl | `docker build --build-arg REACT_APP_BASE_URL=https://test-api-wildlifenl.uu.nl .` |

The version shown in the navbar is the build date (`YY.MM.DD`), set automatically by `npm run build`. The TEST instance also shows `TEST` next to it.

## Design system

The UI follows the field notebook redesign from the design canvas named ResearchConnect Redesign

- Tokens are `--rc-*` CSS custom properties in `src/styles/tokens.css`, colours, type, spacing, radii and layers
- `src/styles/base.css` is the only file that styles bare elements: reset, body type and the moss focus ring
- `src/styles/components.css` holds the shared `rc-` classes (buttons, fields, chips, banners, cards, dialogs, tables, tabs), page files keep layout only
- Fonts are self-hosted with Fontsource and imported in `src/index.tsx`: Fraunces for titles, Source Sans 3 for the interface, IBM Plex Mono for IDs and patterns
- Shared React pieces live in `src/components/ui` (Button, Dialog, Banner, StatusChip, Field, PageHeader), page helpers in `src/hooks` and `src/utils`
- Experiment pages render inside `ExperimentPage`, which loads the experiment from the URL so deep links and refreshes work
- Phone layouts start below 720px, use `useMediaQuery(PHONE_QUERY)` when the markup has to change and plain CSS otherwise

