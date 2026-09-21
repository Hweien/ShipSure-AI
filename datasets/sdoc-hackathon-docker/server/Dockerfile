FROM python:3.12-bookworm

WORKDIR /app

COPY datasets/sdoc-hackathon-docker/server/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir \
    --trusted-host pypi.org \
    --trusted-host files.pythonhosted.org \
    -r requirements.txt

COPY datasets/sdoc-hackathon-docker/server/scoring.py ./scoring.py
COPY datasets/sdoc-hackathon-docker/server/app.py ./app.py
COPY datasets/sdoc-hackathon-docker/server/score_cli.py ./score_cli.py

COPY datasets/sdoc-hackathon-docker/data_v2/inbox /data/inbox
COPY datasets/sdoc-hackathon-docker/data_v2/attachments /data/attachments
COPY datasets/sdoc-hackathon-docker/data_v2/sample_submission.json /data/sample_submission.json

ENV DATA_DIR=/data
ENV GROUND_TRUTH=/etc/secrets/ground_truth.json

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]