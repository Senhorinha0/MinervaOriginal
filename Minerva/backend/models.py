from datetime import datetime
from sqlalchemy import Numeric
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(50), unique=True, nullable=False, index=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    conta = db.Column(db.String(10), unique=True, nullable=False)

    saldo = db.Column(Numeric(18, 2), default=0.00, nullable=False)
    omega_saldo = db.Column(Numeric(18, 8), default=0, nullable=False)

    bloqueado = db.Column(db.Boolean, default=False)
    ultimo_acesso = db.Column(db.DateTime, default=datetime.utcnow)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    carteira = db.relationship("CarteiraAtivo", backref="usuario", lazy=True,
                                cascade="all, delete-orphan")
    metas = db.relationship("Meta", backref="usuario", lazy=True,
                             cascade="all, delete-orphan")
    historico = db.relationship("HistoricoFinanceiro", backref="usuario", lazy=True,
                                 cascade="all, delete-orphan")
    omega_blocos = db.relationship("OmegaBloco", backref="usuario", lazy=True,
                                    cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "usuario": self.usuario,
            "conta": self.conta,
            "saldo": float(self.saldo),
            "omegaSaldo": float(self.omega_saldo),
            "carteira": {c.ticker: c.quantidade for c in self.carteira},
            "metas": [m.to_dict() for m in self.metas],
        }


class CarteiraAtivo(db.Model):
    __tablename__ = "carteira_ativos"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    ticker = db.Column(db.String(20), nullable=False)
    quantidade = db.Column(db.Integer, default=0, nullable=False)

    __table_args__ = (db.UniqueConstraint("usuario_id", "ticker", name="uq_usuario_ticker"),)


class Meta(db.Model):
    __tablename__ = "metas"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    valor = db.Column(Numeric(18, 2), nullable=False)
    atual = db.Column(Numeric(18, 2), default=0.00)
    concluida = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "valor": float(self.valor),
            "atual": float(self.atual),
            "concluida": self.concluida,
        }


class HistoricoFinanceiro(db.Model):
    __tablename__ = "historico_financeiro"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    descricao = db.Column(db.String(255), nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "descricao": self.descricao,
            "data": self.criado_em.strftime("%H:%M:%S"),
        }


class PixMensagem(db.Model):
    __tablename__ = "pix_mensagens"

    id = db.Column(db.Integer, primary_key=True)
    de_usuario = db.Column(db.String(50), nullable=False)
    para_usuario = db.Column(db.String(50), nullable=False)
    valor = db.Column(Numeric(18, 2), nullable=False)
    mensagem = db.Column(db.String(255))
    tipo = db.Column(db.String(20), nullable=False)  # chat-enviado | chat-recebido | chat-pedido
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "de": self.de_usuario,
            "para": self.para_usuario,
            "valor": f"{float(self.valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "mensagem": self.mensagem,
            "data": self.criado_em.strftime("%H:%M:%S"),
            "tipo": self.tipo,
        }


class OmegaBloco(db.Model):
    __tablename__ = "omega_blocos"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # DEPÓSITO | SAQUE | SISTEMA
    valor = db.Column(Numeric(18, 8), nullable=False)
    hash = db.Column(db.String(80), nullable=False)
    hash_anterior = db.Column(db.String(80), nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "tipo": self.tipo,
            "valor": float(self.valor),
            "hash": self.hash,
            "hashAnterior": self.hash_anterior,
            "timestamp": self.criado_em.strftime("%H:%M:%S"),
        }
