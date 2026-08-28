'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';

type CellValue = number | null;
type BingoCard = { title: string; numbers: CellValue[][] };
type Notice = { type: 'error' | 'info'; text: string } | null;

const columns = ['B', 'I', 'N', 'G', 'O'];

function isValidCard(value: unknown): value is BingoCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<BingoCard>;
  return (
    typeof card.title === 'string' &&
    card.title.trim().length > 0 &&
    Array.isArray(card.numbers) &&
    card.numbers.length === 5 &&
    card.numbers.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 5 &&
        row.every(
          (cell) =>
            cell === null ||
            (typeof cell === 'number' && Number.isInteger(cell) && cell >= 1 && cell <= 75),
        ),
    )
  );
}

function isValidMarkedNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 75;
}

function hasBingo(card: BingoCard, calledNumbers: Set<number>) {
  return card.numbers.every((row) =>
    row.every((number) => number === null || calledNumbers.has(number)),
  );
}

export default function Home() {
  const [cards, setCards] = useState<BingoCard[] | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<Set<number>>(new Set());
  const [numberInput, setNumberInput] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const marksSaveRef = useRef(Promise.resolve());

  const activeCards = cards ?? [];
  const canMark = activeCards.length > 0;
  const winners = activeCards.filter((card) => hasBingo(card, calledNumbers));
  const sortedCalledNumbers = Array.from(calledNumbers).reverse();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let isCurrent = true;
    async function loadSavedGame() {
      try {
        const response = await fetch('/api/bingo', { cache: 'no-store' });
        if (!response.ok) throw new Error('load-failed');
        const data = (await response.json()) as { cards?: unknown; calledNumbers?: unknown };
        const savedCards = Array.isArray(data.cards) && data.cards.every(isValidCard) ? data.cards : [];
        const savedNumbers = Array.isArray(data.calledNumbers)
          ? data.calledNumbers.filter(isValidMarkedNumber)
          : [];
        if (!isCurrent) return;
        setCards(savedCards);
        setCalledNumbers(new Set(savedNumbers));
        if (!savedCards.length) {
          setNotice({
            type: 'error',
            text: 'Nenhuma cartela foi encontrada em public/cartelas.json. Carregue um JSON para começar.',
          });
        }
      } catch {
        if (!isCurrent) return;
        setCards([]);
        setNotice({
          type: 'error',
          text: 'Não foi possível ler as cartelas salvas. Carregue um JSON para começar.',
        });
      }
    }
    void loadSavedGame();
    return () => { isCurrent = false; };
  }, []);

  function persistMarks(numbers: Set<number>) {
    const calledNumbers = Array.from(numbers);
    marksSaveRef.current = marksSaveRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const response = await fetch('/api/bingo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveMarks', calledNumbers }),
          });
          if (!response.ok) throw new Error('save-failed');
        } catch {
          setNotice({ type: 'error', text: 'A marcação foi feita na tela, mas não pôde ser salva no arquivo.' });
        }
      });
  }

  function markNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canMark) {
      setNotice({ type: 'error', text: 'Carregue as cartelas antes de marcar números.' });
      return;
    }
    const parsed = Number(numberInput);
    if (!numberInput.trim() || !Number.isInteger(parsed) || parsed < 1 || parsed > 75) {
      setNotice({ type: 'error', text: 'Digite um número inteiro de 1 a 75.' });
      inputRef.current?.focus();
      return;
    }
    const appearsOnCard = activeCards.some((card) => card.numbers.some((row) => row.includes(parsed)));
    const next = new Set(calledNumbers);
    next.add(parsed);
    setCalledNumbers(next);
    setNumberInput('');
    setNotice(appearsOnCard ? null : { type: 'info', text: `O número ${parsed} não está nestas cartelas.` });
    void persistMarks(next);
    inputRef.current?.focus();
  }

  function undoLast() {
    if (!sortedCalledNumbers.length) return;
    const lastCalled = sortedCalledNumbers[0];
    const next = new Set(calledNumbers);
    next.delete(lastCalled);
    setCalledNumbers(next);
    setNotice({ type: 'info', text: `Marcação do número ${lastCalled} removida.` });
    void persistMarks(next);
    inputRef.current?.focus();
  }

  function clearMarks() {
    const next = new Set<number>();
    setCalledNumbers(next);
    setNotice(null);
    void persistMarks(next);
    inputRef.current?.focus();
  }

  async function loadJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const importedCards = Array.isArray(parsed) ? parsed : (parsed as { cards?: unknown })?.cards;
      if (!Array.isArray(importedCards) || importedCards.length < 1 || importedCards.length > 4 || !importedCards.every(isValidCard)) {
        throw new Error('invalid-cards');
      }
      const response = await fetch('/api/bingo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveCards', cards: importedCards }),
      });
      if (!response.ok) throw new Error('save-failed');
      setCards(importedCards);
      setCalledNumbers(new Set());
      setNotice({
        type: 'info',
        text: `${importedCards.length} ${importedCards.length === 1 ? 'cartela carregada e salva' : 'cartelas carregadas e salvas'}.`,
      });
    } catch {
      setNotice({ type: 'error', text: 'JSON inválido ou não foi possível salvá-lo. Use de 1 a 4 cartelas no formato esperado.' });
    } finally {
      event.target.value = '';
      inputRef.current?.focus();
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="Marcador de bingo">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <span className="brand-name">MARCA BINGO</span>
        </div>
        <div className="topbar-meta">
          <span className="live-dot" aria-hidden="true" /><span>Cartelas em jogo</span>
          <strong>{activeCards.length.toString().padStart(2, '0')}</strong>
        </div>
      </header>

      {winners.length > 0 && (
        <section className="bingo-alert" role="alert" aria-live="assertive">
          <span aria-hidden="true">★</span>
          <div><strong>BINGO!</strong><small>{winners.length === 1 ? `Cartela ${winners[0].title} completa` : `${winners.length} cartelas completas`}</small></div>
          <span aria-hidden="true">★</span>
        </section>
      )}

      <div className="workspace">
        <section className="cards-panel" aria-label="Cartelas de bingo">
          <div className="section-heading">
            <div><p>ACOMPANHAMENTO AO VIVO</p><h1>Suas cartelas</h1></div>
            <span>{calledNumbers.size} números marcados</span>
          </div>
          {cards === null ? (
            <section className="empty-cards" aria-live="polite"><strong>Carregando cartelas…</strong></section>
          ) : activeCards.length === 0 ? (
            <section className="empty-cards" aria-live="polite">
              <span aria-hidden="true">↥</span><h2>Nenhuma cartela encontrada</h2>
              <p>Adicione <code>public/cartelas.json</code> ou carregue um arquivo JSON abaixo.</p>
              <button type="button" onClick={() => fileRef.current?.click()}>Carregar JSON</button>
            </section>
          ) : (
            <div className={`cards-grid cards-${activeCards.length}`}>
              {activeCards.map((card, cardIndex) => {
                const winner = hasBingo(card, calledNumbers);
                return (
                  <article className={`bingo-card${winner ? ' is-winner' : ''}`} key={`${card.title}-${cardIndex}`}>
                    <div className="card-topline">
                      <div className="mini-brand" aria-hidden="true"><span className="mini-mark">•••</span><span>BINGO</span></div>
                      <div className="card-title"><small>CARTELA</small><strong>{card.title}</strong></div>
                    </div>
                    {winner && <div className="winner-ribbon">BINGO!</div>}
                    <div className="bingo-table" role="table" aria-label={`Cartela ${card.title}`}>
                      <div className="bingo-row bingo-header" role="row">
                        {columns.map((column) => <div role="columnheader" key={column}>{column}</div>)}
                      </div>
                      {card.numbers.map((row, rowIndex) => (
                        <div className="bingo-row" role="row" key={rowIndex}>
                          {row.map((number, columnIndex) => {
                            const marked = number === null || calledNumbers.has(number);
                            return <div role="cell" className={`${marked ? 'marked' : ''}${number === null ? ' free' : ''}`} key={`${rowIndex}-${columnIndex}`} aria-label={number === null ? 'Espaço livre' : `Número ${number}${marked ? ', marcado' : ''}`}>{number === null ? <span aria-hidden="true">★</span> : number}</div>;
                          })}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="control-panel" aria-label="Painel de marcação">
          <div className="control-title"><span>MARCADOR</span><h2>Qual número saiu?</h2><p>{canMark ? 'Digite o número e pressione Enter.' : 'Carregue uma cartela para habilitar a marcação.'}</p></div>
          <form onSubmit={markNumber} className="number-form">
            <label htmlFor="bingo-number">Número sorteado</label>
            <div className="input-row">
              <input ref={inputRef} id="bingo-number" type="number" inputMode="numeric" min="1" max="75" autoComplete="off" placeholder="00" value={numberInput} disabled={!canMark} onChange={(event) => { setNumberInput(event.target.value); setNotice(null); }} />
              <button type="submit" className="confirm-button" aria-label="Confirmar número" disabled={!canMark}><span>Marcar</span><b aria-hidden="true">→</b></button>
            </div>
          </form>
          {notice && <p className={`notice ${notice.type}`} role="status">{notice.text}</p>}

          <div className="recent-section">
            <div className="recent-heading"><h3>Marcados</h3><button type="button" onClick={() => setShowHistory((value) => !value)} disabled={!sortedCalledNumbers.length}>{showHistory ? 'Recolher' : 'Ver todos'}</button></div>
            {sortedCalledNumbers.length ? <div className={`number-history${showHistory ? ' expanded' : ''}`}>{sortedCalledNumbers.map((number, index) => <span className={index === 0 ? 'latest' : ''} key={number}>{number}</span>)}</div> : <p className="empty-history">Nenhum número marcado ainda.</p>}
          </div>

          <div className="panel-actions">
            <button type="button" onClick={undoLast} disabled={!calledNumbers.size}>Desfazer último</button>
            <button type="button" onClick={clearMarks} disabled={!calledNumbers.size}>Limpar marcações</button>
          </div>
          <div className="json-loader">
            <div><strong>{canMark ? 'Outras cartelas?' : 'Vamos começar?'}</strong><span>{canMark ? <>Carregue até 4. <a href="/cartelas.json" download>Baixar atual</a></> : 'Carregue um JSON com até 4 cartelas.'}</span></div>
            <button type="button" onClick={() => fileRef.current?.click()}>Carregar JSON</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={loadJson} hidden />
          </div>
        </aside>
      </div>
    </main>
  );
}
