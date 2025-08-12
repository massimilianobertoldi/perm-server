#!/usr/bin/env python3
"""
Web application per il calcolo delle permutazioni di cinque numeri.

Questo script implementa un semplice server HTTP basato sul modulo
`http.server` della libreria standard di Python. L'interfaccia
HTML permette all'utente di inserire cinque numeri (separati da
virgole) e inviarli al server, che calcolerà tutte le permutazioni
possibili utilizzando `itertools.permutations` e restituirà il
risultato in una pagina web.

Nota: Il server ascolta sulla porta 8000 di localhost. Per
ragioni di sicurezza e per l'ambiente isolato in cui viene eseguito,
non è accessibile dall'esterno.
"""

import itertools
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs


class PermutationHandler(BaseHTTPRequestHandler):
    """Handler per le richieste HTTP del server.

    Gestisce due tipi di richieste:
    - GET: restituisce un semplice modulo HTML per l'inserimento dei numeri.
    - POST: elabora i numeri inviati e restituisce le permutazioni.
    """

    def _write_response(self, html: str) -> None:
        """Scrive una risposta HTML al client.

        Args:
            html: La stringa HTML da inviare al client.
        """
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

    def do_GET(self) -> None:  # pylint: disable=invalid-name
        """Gestisce le richieste GET.

        Restituisce un modulo HTML semplice che chiede all'utente
        di inserire cinque numeri separati da virgole.
        """
        html = """
            <html>
            <head><title>Calcolo Permutazioni</title></head>
            <body>
                <h1>Calcola tutte le permutazioni di 5 numeri</h1>
                <form method="POST" action="/">
                    <label>Inserisci cinque valori (separati da virgole): </label>
                    <input type="text" name="nums" placeholder="es. 1,2,3,4,5" />
                    <button type="submit">Calcola</button>
                </form>
            </body>
            </html>
        """
        self._write_response(html)

    def do_POST(self) -> None:  # pylint: disable=invalid-name
        """Gestisce le richieste POST.

        Analizza i numeri inviati dal modulo, calcola tutte le
        permutazioni e restituisce il risultato formattato in HTML.
        """
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        params = parse_qs(body)
        nums_str = params.get('nums', [''])[0]
        try:
            # Suddivide la stringa in base alla virgola e rimuove eventuali spazi
            items = [item.strip() for item in nums_str.split(',') if item.strip()]
            if len(items) != 5:
                raise ValueError("Occorre inserire esattamente 5 valori.")
            # Calcola le permutazioni
            permutations = list(itertools.permutations(items))
            # Costruisce l'HTML di risposta
            result = """
                <html>
                <head><title>Risultato Permutazioni</title></head>
                <body>
                    <h1>Risultato</h1>
                    <p>Le permutazioni dei valori inseriti sono:</p>
                    <ul>
            """
            for perm in permutations:
                result += f"<li>{', '.join(perm)}</li>\n"
            result += """
                    </ul>
                    <a href="/">Torna indietro</a>
                </body>
                </html>
            """
        except Exception as e:  # pylint: disable=broad-except
            # Gestisce eventuali errori durante l'elaborazione
            result = f"""
                <html>
                <body>
                    <p>Errore: {e}</p>
                    <a href="/">Riprova</a>
                </body>
                </html>
            """
        self._write_response(result)


def run_server(port: int = 8000) -> None:
    """Avvia il server HTTP sulla porta specificata.

    Args:
        port: Porta TCP su cui avviare il server. Default: 8000.
    """
    server_address = ('', port)
    with HTTPServer(server_address, PermutationHandler) as httpd:
        print(f"Server in esecuzione su http://localhost:{port}")
        httpd.serve_forever()


if __name__ == '__main__':
    run_server()