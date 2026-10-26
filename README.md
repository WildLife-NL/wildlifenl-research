# ResearchConnect

Welcome to the official GitHub repository of **ResearchConnect** for **WildlifeNL**. ResearchConnect serves as a research portal designed to facilitate the creation and management of experiments. In these experiments, researchers can create questionnaires and messages that will be sent when certain conditions are met to collect data for their research. The collected data from these experiments can also be exported in CSV format for further analysis. For more detailed instructions, please refer to the [Docs](./Docs) folder.

## Deployment

ResearchConnect runs as two instances, both built from the `Dockerfile`. The API is chosen at build time with the `REACT_APP_BASE_URL` build argument, which defaults to the LIVE API.

| Instance | URL | Build |
| --- | --- | --- |
| LIVE | researchconnect.wildlifenl.nl | `docker build .` |
| TEST | test-researchconnect.wildlifenl.nl | `docker build --build-arg REACT_APP_BASE_URL=https://test-api-wildlifenl.uu.nl .` |

The version shown in the navbar is the build date (`YY.MM.DD`), set automatically by `npm run build`. The TEST instance also shows `TEST` next to it.
