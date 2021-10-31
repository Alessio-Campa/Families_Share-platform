# Guida per eseguire families share #
Clonata la repo e creato un database mongodb, è necessario creare per ogni file .env.sample un nuovo file .env, il quale conterrà i campi di .env.sample, ma i valori saranno personali per ogni sviluppatore. In teoria l'env file del client non è necessario, ma meglio farlo lo stesso.
### *.env* in */* ###
```
DB_PROD_HOST= <stringa di connessione al db>
DB_DEV_HOST= <stringa di connessione al db>
DB_TEST_HOST= <stringa di connessione al db>
HTTP_PORT=4000
HTTPS_PORT=4443
SERVER_SECRET= <stringa segreta a caso> 
SERVER_MAIL=
SERVER_MAIL_PASSWORD=
GOOGLE_DEV_CLIENT_EMAIL=
GOOGLE_DEV_PRIVATE_KEY= <chiavi api google>
GOOGLE_PROD_CLIENT_EMAIL=
GOOGLE_PROD_PRIVATE_KEY= <chiavi api gooogle>
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CITYLAB= ALL
CITYLAB_URI=
CRONJOB=
```
### *.env* in * /client/ * ###
```
REACT_APP_GOOGLE_CLIENT_ID =
REACT_APP_GA_ID=
REACT_APP_SENTRY_DSN =
REACT_APP_CITYLAB_NAME=
REACT_APP_CITYLAB_LANGUAGES = IT
REACT_APP_CITYLAB = ALL
REACT_APP_CITYLAB_TITLE=
REACT_APP_COMMUNITY_MANAGER_ID=
```
## eseguire backend ##
Aprire un terminale nella root directory del progetto e dare il comando ```npm install``` per installare tutte le dipendenze, una volta che la procedura si è conclusa senza errori (ma segnalando molte vulnerabilità), dare il comando ```npm start``` per eseguire il back-end del progetto.
Se tutto è stato configurato bene, si riceverà il seguente output:
```
Server started at http://localhost:4000.
Connected to database
```
Da qui in poi, potremmo visualizzare tutte le richieste in arrivo sul server di backend da questo terminale.
### supervisor ###
È necessario aprire una parentesi su supervisor: di default node (che runna il backend) non rileva modifiche nel codice, di conseguenza sarà necessario rieseguire manualmente il programma per testare ogni modifica nel codice di backend. Supervisor (installabile con ```npm install supervisor -g```) automatizza la cosa, rilevando in automatico modifiche nel codice e restartando il server in automatico. Per eseguire il backend usando supervisor usare il comando ```npm run dev-server```.
## eseguire frontend ##
Dobbiamo ora startare il react-native client, apriamo un altro terminale, spostandoci sulla directory /client/, eseguiamo ```npm install``` come per il backend e ```npm start``` per farlo partire. Trattandosi di un framework, ci metterà un po' per partire, nell'attesa andatevi a prendere uno spritz, siete stati bravi ad arrivare fin qui. Se si è aperta una pagina web con la homepage di families_share siete riusciti a far partire il progetto.
Creando un account, il server farà il primo inserimento in database e lo schema si creerà in automatico.
