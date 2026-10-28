import axios from 'axios'

export interface GistFileItem {
  filename?: string;
  type?: string;
  language?: string;
  raw_url?: string;
  size?: number;
  truncated?: boolean;
  content: string;
}

export interface GistResponse {
  id: string;
  updated_at: string;
  files: Record<string, GistFileItem>;
}

class GistProvider {
  token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  get(gist_id: string) {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers.Authorization = `token ${this.token}`;
    }
    return axios.get<GistResponse>(`https://api.github.com/gists/${gist_id}?_t=${String(Date.now())}`, {
      headers,
      timeout: 15000,
    });
  }

  update(
    id: string,
    params: {
      filename: string;
      content: string;
    }
  ) {
    if (!this.token || !id) {
      return null;
    }

    const { filename, content } = params;
    return axios.patch<GistResponse>(
      `https://api.github.com/gists/${id}`,
      {
        files: { [filename]: { content } },
      },
      {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 20000,
      }
    );
  }
}

export default new GistProvider();
