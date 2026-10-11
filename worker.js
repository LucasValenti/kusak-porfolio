// Una sola dirección pública: www.kusak.dev y kusak.kusak.workers.dev redirigen (301) a https://kusak.dev.
// Todo lo demás lo sirven los archivos estáticos de dist/ (con sus cabeceras de _headers).
const CANONICO = "kusak.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== CANONICO) {
      url.hostname = CANONICO;
      url.protocol = "https:";
      url.port = "";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
