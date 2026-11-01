import Link from "next/link";
export default function AccessDeniedPage() { return <main className="shell"><section className="page-head"><span className="eyebrow">403</span><h1>Недостаточно прав</h1><p>Эта страница доступна только сотрудникам с соответствующей ролью.</p><Link className="text-link" href="/">Вернуться на витрину</Link></section></main>; }
