#  Student Performance Prediction — ML Audit Pipeline (PERFECT VERSION)

Proyek ini adalah sistem audit Machine Learning end-to-end yang modular dan siap produksi untuk memprediksi kelulusan mahasiswa berdasarkan berbagai parameter demografis dan akademik.

---

##  Referensi & Dasar Audit
Sistem ini dibangun berdasarkan standar **Principal ML Engineer** dengan mematuhi 5 Fase Audit:
1. **Fase 1: Data Loading & EDA** — Deteksi profil data dan distribusi target.
2. **Fase 2: Data Preparation** — 7 teknik (Cleaning, Imputation, Transformation, Outlier, Splitting, Normalization, Imbalance).
3. **Fase 3: Feature Engineering** — 5 teknik (Addition, Extraction, Reduction, Selection, PCA).
4. **Fase 4: Modeling** — Audit perbandingan 3 model (Random Forest, XGBoost, Gradient Boosting) dengan SMOTE & Hyperparameter Tuning.
5. **Fase 5: Evaluation** — Dashboard performa (F1, Accuracy, Precision, Recall, AUC-ROC, dan CV Mean/Std).

---

##  Instalasi & Persiapan

### 1. Persiapkan Environment
Pastikan Anda memiliki Python 3.9+ terinstal.

### 2. Instal Dependencies
Jalankan perintah berikut untuk menginstal semua pustaka yang diperlukan:
```bash
pip install -r requirements.txt
```

### 3. Struktur Folder
Pastikan dataset CSV Anda diletakkan di dalam folder:
`data/raw/`

---

## Cara Penggunaan

### A. Jalankan Audit lewat Notebook (Alur Utama)
Seluruh pipeline (Fase 1–6) ada di satu notebook yang berdiri sendiri. Buka dan jalankan semua sel:
`notebooks/Model_ML.ipynb` (dataset: `data/raw/kaggle_higher_ed_01.csv`, target `grade` → estimasi IPK 0–7).

**Hasil akan tersimpan di folder `outputs/`:**
- `model_comparison.csv` — Tabel perbandingan performa (Accuracy, Precision, Recall, F1-Score, AUC-ROC, CV F1 Mean/Std).
- `confusion_matrix_best.png` — Confusion matrix model terbaik.
- `feature_importance_best.png` — Feature importance model terbaik.
- `models/preprocessors.pkl` + `models/{random_forest,xgboost,gradient_boosting}.pkl` — preprocessor & 3 model siap-saji (Fase 6), nama & strukturnya cocok dengan `app.py`.

EDA awal tersedia di `notebooks/EDA.ipynb`.

### B. (Opsional) Sajikan Model via API
`app.py` (FastAPI) menyajikan model `.pkl` dari `outputs/models/` untuk dipakai frontend:
```bash
uvicorn app:app --reload
```

---

## Teknologi yang Digunakan
- **Core**: Python, Pandas, NumPy
- **ML Framework**: Scikit-Learn, XGBoost
- **Sampling**: Imbalanced-learn (SMOTE)
- **Visualization**: Matplotlib, Seaborn
- **Persistence**: Joblib

---
**Status Audit:** ✅ PERFECT VERSION (Inference Ready, No Data Leakage)
