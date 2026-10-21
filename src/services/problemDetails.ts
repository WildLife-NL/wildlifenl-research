interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: { message?: string; location?: string }[];
}

export const getProblemMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const problem: ProblemDetails = await response.json();
    const fieldErrors = (problem.errors ?? [])
      .filter((error) => error.message)
      .map((error) => (error.location ? `${error.location.replace(/^body\./, '')}: ${error.message}` : error.message));
    const summary = problem.detail || problem.title || fallback;
    return [summary, ...fieldErrors].join('\n');
  } catch {
    return `${fallback} (status ${response.status})`;
  }
};
