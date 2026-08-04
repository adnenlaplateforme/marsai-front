import { expect, it, describe } from 'vitest';
import { participantsCsv } from './participantsCsv';

const headers = ['Nom', 'Prénom', 'E-mail', 'Inscription'];

const BOM = '﻿';

/**
 * L'API sérialise `created_at` en ISO UTC. La date est construite ici en heure
 * *locale* puis convertie, si bien que l'attente « 2026-07-01 12:30 » tient quel
 * que soit le fuseau de la machine qui lance les tests — tout en exerçant bel et
 * bien la conversion depuis UTC.
 */
const LOCAL_NOON = new Date(2026, 6, 1, 12, 30).toISOString();

const booking = (over = {}) => ({
  id: 1,
  participant_id: 10,
  firstname: 'Alice',
  lastname: 'Martin',
  email: 'alice@test.com',
  created_at: LOCAL_NOON,
  ...over,
});

/** Le séparateur de lignes est CRLF : c'est celui que RFC 4180 impose. */
const lines = csv => csv.replace(BOM, '').split('\r\n');

describe('participantsCsv', () => {
  it('pose les en-têtes puis une ligne par participant', () => {
    const csv = participantsCsv([booking()], headers);

    expect(lines(csv)[0]).toBe('Nom,Prénom,E-mail,Inscription');
    expect(lines(csv)[1]).toContain('Martin,Alice,alice@test.com');
    expect(lines(csv)).toHaveLength(2);
  });

  it('rend les en-têtes seuls quand personne n’a réservé', () => {
    expect(lines(participantsCsv([], headers))).toEqual([
      'Nom,Prénom,E-mail,Inscription',
    ]);
  });

  /**
   * Excel lit un CSV en ANSI par défaut : sans la marque d'ordre des octets, les
   * « Éloïse » et les « Rodríguez » de la liste arrivent en charabia. C'est la
   * moitié d'un fichier de participants d'un festival marseillais.
   */
  it('commence par la marque d’ordre des octets, pour Excel', () => {
    expect(participantsCsv([booking()], headers).startsWith(BOM)).toBe(true);
  });

  /**
   * Le séparateur est une virgule : un nom composé la contenant couperait la
   * ligne en deux colonnes et décalerait tout le reste du fichier.
   */
  it('encadre de guillemets un champ qui contient une virgule', () => {
    const csv = participantsCsv(
      [booking({ lastname: 'Martin, épouse Durand' })],
      headers
    );

    expect(lines(csv)[1]).toContain('"Martin, épouse Durand"');
  });

  it('double les guillemets présents dans un champ', () => {
    const csv = participantsCsv(
      [booking({ firstname: 'Jean "Jano"' })],
      headers
    );

    expect(lines(csv)[1]).toContain('"Jean ""Jano"""');
  });

  it('garde un retour à la ligne à l’intérieur de son champ', () => {
    const csv = participantsCsv([booking({ lastname: 'De\nLuca' })], headers);

    expect(csv).toContain('"De\nLuca"');
    // La ligne du participant ne se scinde pas : le CSV garde ses deux lignes
    // logiques, en-têtes comprises.
    expect(lines(csv)).toHaveLength(2);
  });

  /**
   * `POST /bookings` est une route publique : le prénom vient d'un formulaire
   * ouvert à tous. Un champ qui commence par `=` est exécuté comme une formule à
   * l'ouverture du fichier — l'apostrophe le neutralise sans le déformer à
   * l'écran.
   */
  it('neutralise un champ qui commence comme une formule', () => {
    const csv = participantsCsv(
      [booking({ firstname: '=1+1', lastname: '@SUM(A1)' })],
      headers
    );

    expect(lines(csv)[1]).toContain("'@SUM(A1)");
    expect(lines(csv)[1]).toContain("'=1+1");
  });

  it('accepte un participant sans prénom ni nom', () => {
    const csv = participantsCsv(
      [booking({ firstname: null, lastname: null })],
      headers
    );

    expect(lines(csv)[1]).toBe(',,alice@test.com,2026-07-01 12:30');
  });

  /**
   * La date est écrite en heure locale et dans un format trié par ordre
   * alphabétique. Un format localisé porterait sa propre virgule — « 01/07/2026,
   * 12:30 » ouvrirait une colonne de plus.
   */
  it('écrit la date d’inscription sans séparateur ambigu', () => {
    const csv = participantsCsv([booking()], headers);

    expect(lines(csv)[1]).toContain('2026-07-01 12:30');
  });

  it('laisse la date vide quand elle est absente', () => {
    const csv = participantsCsv([booking({ created_at: null })], headers);

    expect(lines(csv)[1]).toBe('Martin,Alice,alice@test.com,');
  });
});
